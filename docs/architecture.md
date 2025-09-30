# アーキテクチャ設計

## システム概要

GC Todo Appは、Next.js 15のApp RouterとSupabaseを組み合わせたフルスタックアプリケーションです。サーバーサイドレンダリング（SSR）とクライアントサイドの最適な組み合わせで、高速で安全なTodo管理を実現しています。

## 技術スタック

### フロントエンド
- **Next.js 15**: React フレームワーク（App Router使用）
- **React 19**: UIライブラリ
- **TypeScript**: 型安全性の確保
- **Tailwind CSS**: ユーティリティファーストCSS

### バックエンド・データベース
- **Supabase**: BaaS（Backend as a Service）
  - PostgreSQL データベース
  - 認証システム
  - Row Level Security (RLS)
  - リアルタイム機能（将来拡張用）

### 認証・セキュリティ
- **Supabase Auth**: メール/パスワード認証
- **Next.js Auth Helpers**: セッション管理
- **Row Level Security**: データベースレベルでのアクセス制御

## アーキテクチャパターン

### 1. Server Components + Client Components
```
Server Components (SSR)
├── データフェッチ
├── 認証チェック
└── 初期レンダリング

Client Components
├── インタラクティブなUI
├── フォーム処理
└── リアルタイム更新
```

### 2. 認証フロー
```
1. ユーザーがログイン
2. Supabase Auth で認証
3. JWT トークンがクッキーに保存
4. ミドルウェアでセッション検証
5. Server Components でセッション取得
6. RLS でデータアクセス制御
```

### 3. データフロー
```
Client Component
    ↓ (Server Action)
Server Component
    ↓ (Supabase Client)
Supabase Database
    ↓ (RLS Policy)
User Data Only
```

## ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── todos/
│   │   ├── page.tsx       # Todo一覧ページ（Server Component）
│   │   └── AddTodoForm.tsx # Todo追加フォーム（Client Component）
│   ├── login/             # ログインページ（将来実装）
│   └── page.tsx           # ホームページ
├── components/            # 再利用可能なコンポーネント
│   └── Auth.tsx           # 認証フォーム（Client Component）
├── lib/                   # ユーティリティ・設定
│   ├── supabaseClient.ts  # クライアント用Supabase設定
│   └── supabaseServer.ts  # サーバー用Supabase設定
└── middleware.ts          # 認証ミドルウェア
```

## コンポーネント設計

### Server Components
- **`/app/todos/page.tsx`**: Todo一覧表示、データフェッチ、認証チェック
- **Server Actions**: データの作成・更新・削除処理

### Client Components
- **`Auth.tsx`**: ログイン・新規登録フォーム
- **`AddTodoForm.tsx`**: Todo追加フォーム

## セキュリティ設計

### 1. 認証
- Supabase Auth による JWT ベース認証
- セッション管理は Next.js Auth Helpers で自動化
- ミドルウェアによる全ページでの認証チェック

### 2. 認可
- Row Level Security (RLS) によるデータベースレベルでのアクセス制御
- ユーザーは自分のデータのみアクセス可能

### 3. データ保護
- 環境変数による機密情報の管理
- HTTPS による通信の暗号化
- CSRF 保護（Next.js 標準）

## パフォーマンス最適化

### 1. レンダリング戦略
- Server Components による初期レンダリングの高速化
- Client Components の最小限使用
- 適切なキャッシュ戦略

### 2. データフェッチ
- Server Components での直接データフェッチ
- 不要なクライアントサイド API 呼び出しの回避

### 3. バンドル最適化
- Next.js の自動コード分割
- Tree Shaking による未使用コードの除去

## 拡張性

### 1. 機能拡張
- リアルタイム機能（Supabase Realtime）
- ファイルアップロード（Supabase Storage）
- 通知機能

### 2. スケーラビリティ
- Supabase の自動スケーリング
- Vercel のエッジデプロイメント
- CDN による静的アセット配信

## 開発・運用

### 1. 開発環境
- TypeScript による型安全性
- ESLint によるコード品質管理
- Hot Reload による高速開発

### 2. テスト戦略
- 単体テスト（Jest + React Testing Library）
- 統合テスト（Playwright）
- E2E テスト

### 3. デプロイ
- Vercel への自動デプロイ
- 環境変数の管理
- ログ監視・エラー追跡
