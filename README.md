# GC Todo App ドキュメント

## 概要

GC Todo Appは、Next.js 15とSupabaseを使用したモダンなTodo管理アプリケーションです。認証機能付きで、ユーザーごとにTodoを管理できます。

## ドキュメント一覧

- [アーキテクチャ設計](./architecture.md) - システム全体の設計思想と技術スタック
- [データベース設計](./database.md) - Supabaseのテーブル設計とRLS設定
- [API設計](./api.md) - Client ComponentsとSupabaseクライアントの仕様
- [セットアップガイド](./setup.md) - 開発環境の構築手順
- [デプロイガイド](./deployment.md) - 本番環境へのデプロイ手順

## 主要機能

- ✅ ユーザー認証（ログイン・新規登録）
- ✅ Todoの作成・更新・削除
- ✅ 完了状態の切り替え
- ✅ ユーザーごとのデータ分離
- ✅ レスポンシブデザイン

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Supabase (PostgreSQL, Auth, RLS)
- **認証**: Supabase Auth with Next.js Auth Helpers
- **デプロイ**: Vercel (推奨)

## クイックスタート

```bash
# リポジトリのクローン
git clone <repository-url>
cd gc-app

# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してSupabaseの設定を追加

# 開発サーバーの起動
npm run dev
```

詳細なセットアップ手順は[セットアップガイド](./setup.md)を参照してください。

## プロジェクト構造

```
gc-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── todos/             # Todo管理ページ
│   │   │   └── page.tsx       # Server Component（認証チェック）
│   │   ├── login/             # ログインページ
│   │   │   └── page.tsx       # Auth コンポーネント使用
│   │   └── page.tsx           # ホームページ（リダイレクト）
│   ├── components/            # 再利用可能なコンポーネント
│   │   ├── Auth.tsx           # 認証フォーム（Client Component）
│   │   ├── AddTodoForm.tsx    # Todo追加フォーム（Client Component）
│   │   └── TodoList.tsx       # Todo一覧（Client Component）
│   ├── lib/                   # ユーティリティ
│   │   ├── supabaseClient.ts  # クライアント用Supabase
│   │   └── supabaseServer.ts  # サーバー用Supabase
│   └── middleware.ts          # Next.js ミドルウェア（認証チェック）
├── docs/                      # ドキュメント
└── package.json
```

## ライセンス

MIT License
