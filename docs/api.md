# API設計

## 概要

GC Todo Appでは、Next.js 15のServer ActionsとSupabaseクライアントを組み合わせてAPIを実装しています。RESTful APIではなく、Server Actionsによる型安全なAPI設計を採用しています。

## アーキテクチャ

### 1. Server Actions
- Next.js 15のServer Actionsを使用
- サーバーサイドでのデータ処理
- 型安全性の確保
- 自動的なCSRF保護

### 2. Supabaseクライアント
- サーバーサイド: `createServerComponentClient`
- クライアントサイド: `createClientComponentClient`
- 認証状態の自動管理

## 認証API

### ログイン
```typescript
// クライアント側
const { error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

**レスポンス:**
- 成功: セッション情報がクッキーに保存
- 失敗: エラーオブジェクト

### 新規登録
```typescript
// クライアント側
const { error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

**レスポンス:**
- 成功: ユーザー作成、確認メール送信（設定による）
- 失敗: エラーオブジェクト

### ログアウト
```typescript
// クライアント側
const { error } = await supabase.auth.signOut();
```

## Todo API

### 1. Todo一覧取得

**実装場所:** `src/app/todos/page.tsx` (Server Component)

```typescript
const { data: todos } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', session.user.id)
  .order('id', { ascending: true });
```

**レスポンス:**
```typescript
type Todo = {
  id: number;
  title: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// レスポンス
todos: Todo[] | null
```

### 2. Todo作成

**実装場所:** `src/app/todos/AddTodoForm.tsx` (Client Component)

```typescript
const { error } = await supabase
  .from('todos')
  .insert({ 
    title: trimmed, 
    completed: false, 
    user_id: user.id 
  });
```

**リクエスト:**
```typescript
type CreateTodoRequest = {
  title: string;
  completed?: boolean; // デフォルト: false
};
```

**レスポンス:**
- 成功: 新しいTodoオブジェクト
- 失敗: エラーオブジェクト

### 3. Todo更新（完了状態切り替え）

**実装場所:** `src/app/todos/page.tsx` (Server Action)

```typescript
async function toggleTodo(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;
  const completed = formData.get('completed') === 'true';
  
  await supabase
    .from('todos')
    .update({ completed: !completed })
    .eq('id', id)
    .eq('user_id', session.user.id);
    
  revalidatePath('/todos');
}
```

**リクエスト:**
```typescript
type ToggleTodoRequest = {
  id: string;
  completed: string; // 'true' | 'false'
};
```

### 4. Todo削除

**実装場所:** `src/app/todos/page.tsx` (Server Action)

```typescript
async function deleteTodo(formData: FormData) {
  'use server'
  const id = formData.get('id') as string;
  
  await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);
    
  revalidatePath('/todos');
}
```

**リクエスト:**
```typescript
type DeleteTodoRequest = {
  id: string;
};
```

## エラーハンドリング

### 1. 認証エラー
```typescript
try {
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
} catch (error: any) {
  console.error('認証エラー:', error.message);
  // ユーザーにエラーメッセージを表示
}
```

### 2. データベースエラー
```typescript
try {
  const { error } = await supabase.from('todos').insert(data);
  if (error) throw error;
} catch (error: any) {
  console.error('DBエラー:', error.message);
  // エラーメッセージを表示
}
```

### 3. ネットワークエラー
```typescript
try {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('ネットワークエラー');
} catch (error: any) {
  console.error('ネットワークエラー:', error.message);
}
```

## 型定義

### 共通型
```typescript
// src/types/todo.ts
export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type CreateTodoRequest = {
  title: string;
  completed?: boolean;
};

export type UpdateTodoRequest = {
  id: number;
  title?: string;
  completed?: boolean;
};
```

### 認証型
```typescript
// src/types/auth.ts
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

export type AuthSession = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
};
```

## ミドルウェア

### 認証ミドルウェア
```typescript
// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // セッションを取得してクッキーを更新
  await supabase.auth.getSession()
  
  return res
}
```

## パフォーマンス最適化

### 1. データフェッチの最適化
```typescript
// 必要なカラムのみ取得
const { data } = await supabase
  .from('todos')
  .select('id, title, completed') // 必要なカラムのみ
  .eq('user_id', user.id);
```

### 2. キャッシュ戦略
```typescript
// revalidatePath でキャッシュを無効化
revalidatePath('/todos');
```

### 3. 楽観的UI更新
```typescript
// クライアント側で即座にUI更新
setTodos(prev => [...prev, newTodo]);

// サーバー側で実際の更新
const { error } = await supabase.from('todos').insert(newTodo);
if (error) {
  // エラー時は元に戻す
  setTodos(prev => prev.filter(t => t.id !== newTodo.id));
}
```

## セキュリティ

### 1. 認証チェック
```typescript
// Server Action内での認証チェック
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user) {
  throw new Error('認証が必要です');
}
```

### 2. データ検証
```typescript
// 入力データの検証
const title = String(formData.get('title') ?? '').trim();
if (!title) {
  throw new Error('タイトルは必須です');
}
```

### 3. RLS（Row Level Security）
- データベースレベルでのアクセス制御
- ユーザーは自分のデータのみアクセス可能

## テスト

### 1. 単体テスト
```typescript
// __tests__/todo.test.ts
import { createTodo, updateTodo, deleteTodo } from '../lib/todo-actions';

describe('Todo Actions', () => {
  test('Todoを作成できる', async () => {
    const result = await createTodo({ title: 'テストTodo' });
    expect(result.success).toBe(true);
  });
});
```

### 2. 統合テスト
```typescript
// __tests__/integration/todo-flow.test.ts
import { test, expect } from '@playwright/test';

test('Todoの作成から削除まで', async ({ page }) => {
  await page.goto('/todos');
  await page.fill('[data-testid="todo-input"]', 'テストTodo');
  await page.click('[data-testid="add-button"]');
  
  await expect(page.locator('[data-testid="todo-item"]')).toBeVisible();
});
```

## 将来の拡張

### 1. リアルタイム機能
```typescript
// Supabase Realtime の活用
const subscription = supabase
  .channel('todos')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'todos' },
    (payload) => {
      // リアルタイム更新処理
    }
  )
  .subscribe();
```

### 2. ファイルアップロード
```typescript
// Supabase Storage の活用
const { data, error } = await supabase.storage
  .from('todo-attachments')
  .upload('file.jpg', file);
```

### 3. 検索機能
```typescript
// 全文検索
const { data } = await supabase
  .from('todos')
  .select('*')
  .textSearch('title', '検索キーワード');
```
