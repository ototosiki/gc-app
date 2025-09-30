# データベース設計

## 概要

GC Todo Appでは、Supabase（PostgreSQL）を使用してデータを管理しています。Row Level Security (RLS) により、ユーザーごとのデータ分離を実現しています。

## テーブル設計

### `todos` テーブル

Todoアイテムを管理するメインテーブルです。

```sql
CREATE TABLE public.todos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### カラム詳細

| カラム名 | データ型 | 制約 | 説明 |
|---------|---------|------|------|
| `id` | BIGSERIAL | PRIMARY KEY | 自動採番の主キー |
| `title` | TEXT | NOT NULL | Todoのタイトル |
| `completed` | BOOLEAN | DEFAULT FALSE | 完了状態 |
| `user_id` | UUID | NOT NULL, FK | 作成者のユーザーID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | 作成日時 |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | 更新日時 |

#### インデックス

```sql
-- ユーザーIDでの検索を高速化
CREATE INDEX idx_todos_user_id ON public.todos(user_id);

-- 作成日時でのソートを高速化
CREATE INDEX idx_todos_created_at ON public.todos(created_at);
```

## Row Level Security (RLS) 設定

### RLS の有効化

```sql
-- todos テーブルでRLSを有効化
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
```

### ポリシー設定

#### 1. 参照ポリシー（SELECT）
```sql
CREATE POLICY "Read own todos"
ON public.todos
FOR SELECT
USING (auth.uid() = user_id);
```

#### 2. 作成ポリシー（INSERT）
```sql
CREATE POLICY "Insert own todos"
ON public.todos
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 3. 更新ポリシー（UPDATE）
```sql
CREATE POLICY "Update own todos"
ON public.todos
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 4. 削除ポリシー（DELETE）
```sql
CREATE POLICY "Delete own todos"
ON public.todos
FOR DELETE
USING (auth.uid() = user_id);
```

## 認証テーブル

Supabase Auth が自動的に管理するテーブルです。

### `auth.users` テーブル
- ユーザー情報（メール、パスワードハッシュ等）
- Supabase が自動管理
- `todos.user_id` の外部キー参照先

## データベース関数

### 更新日時の自動更新

```sql
-- updated_at を自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- todos テーブルにトリガーを設定
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 初期データ

### 開発用サンプルデータ（オプション）

```sql
-- 開発環境でのみ実行
INSERT INTO public.todos (title, completed, user_id) VALUES
('サンプルTodo 1', false, 'your-user-id-here'),
('サンプルTodo 2', true, 'your-user-id-here'),
('サンプルTodo 3', false, 'your-user-id-here');
```

## データベース設定手順

### 1. Supabase プロジェクトの作成
1. [Supabase](https://supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトの URL と API キーを取得

### 2. テーブルの作成
Supabase の SQL エディタで以下の SQL を実行：

```sql
-- todos テーブルの作成
CREATE TABLE public.todos (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_created_at ON public.todos(created_at);

-- RLS の有効化
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
CREATE POLICY "Read own todos" ON public.todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own todos" ON public.todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own todos" ON public.todos FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Delete own todos" ON public.todos FOR DELETE USING (auth.uid() = user_id);

-- 更新日時自動更新の設定
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON public.todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. 認証設定
1. Supabase ダッシュボードの「Authentication」→「Settings」
2. 「Site URL」にアプリのURLを設定
3. 必要に応じて「Confirm email」を無効化（開発時）

## データベース操作例

### クライアント側での操作

```typescript
// Todoの作成
const { data, error } = await supabase
  .from('todos')
  .insert({ title: '新しいTodo', completed: false, user_id: user.id });

// Todoの取得
const { data: todos } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

// Todoの更新
const { error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .eq('user_id', user.id);

// Todoの削除
const { error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId)
  .eq('user_id', user.id);
```

## パフォーマンス考慮事項

### 1. インデックス
- `user_id` での検索が頻繁なため、インデックスを設定
- 作成日時でのソートも高速化

### 2. データ量
- ユーザーごとのデータ分離により、スケーラビリティを確保
- 必要に応じてページネーションを実装

### 3. 接続管理
- Supabase の接続プールを活用
- 適切なタイムアウト設定

## バックアップ・復旧

### 1. 自動バックアップ
- Supabase の自動バックアップ機能を活用
- ポイントインタイム復旧（PITR）の設定

### 2. 手動バックアップ
```sql
-- データのエクスポート
COPY (SELECT * FROM public.todos) TO '/path/to/backup.csv' WITH CSV HEADER;
```

## 監視・ログ

### 1. クエリパフォーマンス
- Supabase ダッシュボードでクエリの実行時間を監視
- スロークエリの特定と最適化

### 2. エラーログ
- アプリケーション側でのエラーハンドリング
- Supabase のログ機能を活用

## 将来の拡張

### 1. 追加テーブル
- `categories` テーブル（カテゴリ管理）
- `tags` テーブル（タグ管理）
- `todo_attachments` テーブル（ファイル添付）

### 2. 機能拡張
- 全文検索（PostgreSQL の Full Text Search）
- リアルタイム更新（Supabase Realtime）
- データ分析（Supabase Analytics）
