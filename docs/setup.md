# セットアップガイド

## 前提条件

- Node.js 18.17 以上
- npm または yarn
- Git
- Supabase アカウント

## 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd gc-app
```

## 2. 依存関係のインストール

```bash
npm install
```

## 3. Supabase プロジェクトの設定

### 3.1 Supabase プロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」をクリック
3. プロジェクト名とパスワードを設定
4. リージョンを選択（推奨: Asia Northeast (Tokyo)）
5. プロジェクトを作成

### 3.2 データベースの設定

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

### 3.3 認証設定

1. Supabase ダッシュボードの「Authentication」→「Settings」
2. 「Site URL」に `http://localhost:3000` を設定
3. 「Redirect URLs」に `http://localhost:3000/**` を追加
4. 「Confirm email」を無効化（開発時のみ）

## 4. 環境変数の設定

### 4.1 環境変数ファイルの作成

```bash
cp env.example .env.local
```

### 4.2 環境変数の設定

`.env.local` ファイルを編集：

```env
# Supabase 設定
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# 本番環境用（デプロイ時に設定）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4.3 Supabase の認証情報を取得

1. Supabase ダッシュボードの「Settings」→「API」
2. 「Project URL」をコピー → `NEXT_PUBLIC_SUPABASE_URL`
3. 「anon public」キーをコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 「service_role」キーをコピー → `SUPABASE_SERVICE_ROLE_KEY`

## 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

## 6. 動作確認

### 6.1 認証機能の確認

1. 新規登録でアカウントを作成
2. ログインして `/todos` ページに遷移
3. セッションが保持されていることを確認

### 6.2 Todo機能の確認

1. Todoを追加
2. 完了状態を切り替え
3. Todoを削除
4. データが正しく保存・更新されることを確認

## トラブルシューティング

### よくある問題と解決方法

#### 1. セッションが保持されない

**原因:** ミドルウェアの設定不備

**解決方法:**
```typescript
// src/middleware.ts が正しく設定されているか確認
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

#### 2. RLS エラー

**原因:** ポリシーの設定不備

**解決方法:**
```sql
-- ポリシーが正しく設定されているか確認
SELECT * FROM pg_policies WHERE tablename = 'todos';
```

#### 3. 環境変数エラー

**原因:** 環境変数の設定不備

**解決方法:**
```bash
# 環境変数が正しく読み込まれているか確認
npm run dev
# コンソールでエラーメッセージを確認
```

#### 4. 型エラー

**原因:** TypeScript の設定不備

**解決方法:**
```bash
# 型チェックを実行
npm run build
# エラーメッセージを確認して修正
```

## 開発環境のカスタマイズ

### 1. ESLint の設定

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error"
  }
}
```

### 2. Prettier の設定

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80
}
```

### 3. VS Code の設定

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 本番環境への準備

### 1. 環境変数の設定

本番環境では以下の環境変数を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Supabase の本番設定

1. 「Site URL」を本番URLに変更
2. 「Redirect URLs」に本番URLを追加
3. 「Confirm email」を有効化（本番環境）

### 3. ビルドの確認

```bash
npm run build
npm run start
```

## 追加の開発ツール

### 1. データベース管理

```bash
# Supabase CLI のインストール
npm install -g supabase

# ローカル開発環境の起動
supabase start
```

### 2. 型生成

```bash
# Supabase の型を自動生成
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

### 3. テスト環境

```bash
# テスト用の依存関係をインストール
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# テストの実行
npm test
```

## パフォーマンス最適化

### 1. バンドル分析

```bash
# バンドルサイズの分析
npm install --save-dev @next/bundle-analyzer
```

### 2. 画像最適化

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  images: {
    domains: ['your-image-domain.com'],
  },
});
```

## セキュリティチェック

### 1. 依存関係の脆弱性チェック

```bash
npm audit
npm audit fix
```

### 2. 環境変数の漏洩チェック

```bash
# .env.local が .gitignore に含まれているか確認
cat .gitignore | grep .env
```

### 3. Supabase のセキュリティ設定

1. RLS が有効になっているか確認
2. 不要なAPIキーを無効化
3. アクセスログを監視
