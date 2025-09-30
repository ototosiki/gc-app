# デプロイガイド

## 概要

GC Todo Appは、Vercelを使用した本番環境へのデプロイを推奨しています。VercelはNext.jsアプリケーションに最適化されており、簡単にデプロイできます。

## デプロイ方法

### 1. Vercel へのデプロイ

#### 1.1 Vercel アカウントの作成

1. [Vercel](https://vercel.com) にアクセス
2. GitHubアカウントでサインアップ
3. プロジェクトをインポート

#### 1.2 プロジェクトのインポート

1. Vercel ダッシュボードで「New Project」
2. GitHubリポジトリを選択
3. プロジェクト名を設定
4. 「Deploy」をクリック

#### 1.3 環境変数の設定

Vercel ダッシュボードの「Settings」→「Environment Variables」で以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 2. その他のデプロイ先

#### 2.1 Netlify

```bash
# Netlify CLI のインストール
npm install -g netlify-cli

# ビルド
npm run build

# デプロイ
netlify deploy --prod --dir=out
```

#### 2.2 AWS Amplify

1. AWS Amplify コンソールで「New App」
2. GitHubリポジトリを選択
3. ビルド設定を追加：

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## 本番環境の設定

### 1. Supabase の本番設定

#### 1.1 認証設定

1. Supabase ダッシュボードの「Authentication」→「Settings」
2. 「Site URL」を本番URLに変更
3. 「Redirect URLs」に本番URLを追加
4. 「Confirm email」を有効化

#### 1.2 データベース設定

```sql
-- 本番環境用のインデックス最適化
CREATE INDEX CONCURRENTLY idx_todos_user_id_created_at 
ON public.todos(user_id, created_at DESC);

-- 統計情報の更新
ANALYZE public.todos;
```

### 2. 環境変数の管理

#### 2.1 本番環境変数

```env
# 本番環境
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# セキュリティ
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

#### 2.2 環境変数の検証

```typescript
// lib/env.ts
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL!,
} as const;

// 環境変数の検証
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});
```

## パフォーマンス最適化

### 1. ビルド最適化

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 画像最適化
  images: {
    domains: ['your-image-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 圧縮
  compress: true,
  
  // 実験的機能
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // バンドル分析
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### 2. キャッシュ戦略

```typescript
// lib/cache.ts
export const cacheConfig = {
  // 静的アセットのキャッシュ
  static: {
    maxAge: 31536000, // 1年
  },
  
  // API レスポンスのキャッシュ
  api: {
    maxAge: 300, // 5分
  },
  
  // ページのキャッシュ
  page: {
    maxAge: 3600, // 1時間
  },
};
```

### 3. CDN の設定

```javascript
// next.config.js
const nextConfig = {
  // ヘッダーの設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

## 監視・ログ

### 1. エラー監視

#### 1.1 Sentry の設定

```bash
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### 1.2 ログの設定

```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // 本番環境では外部ログサービスに送信
  },
  
  info: (message: string) => {
    console.log(`[INFO] ${message}`);
  },
  
  warn: (message: string) => {
    console.warn(`[WARN] ${message}`);
  },
};
```

### 2. パフォーマンス監視

#### 2.1 Web Vitals の監視

```typescript
// lib/analytics.ts
export function reportWebVitals(metric: any) {
  // Google Analytics に送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
}
```

#### 2.2 データベース監視

```sql
-- スロークエリの監視
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

## セキュリティ

### 1. HTTPS の設定

```javascript
// next.config.js
const nextConfig = {
  // HTTPS の強制
  async redirects() {
    return [
      {
        source: '/(.*)',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
        ],
        destination: 'https://your-domain.com/$1',
        permanent: true,
      },
    ];
  },
};
```

### 2. セキュリティヘッダー

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};
```

### 3. 環境変数の保護

```typescript
// lib/security.ts
export const isProduction = process.env.NODE_ENV === 'production';

export const validateEnvironment = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
};
```

## バックアップ・復旧

### 1. データベースのバックアップ

```bash
# Supabase の自動バックアップ設定
# ダッシュボードの「Settings」→「Database」→「Backups」
```

### 2. アプリケーションのバックアップ

```bash
# コードのバックアップ
git push origin main

# 環境変数のバックアップ
vercel env pull .env.production
```

### 3. 復旧手順

```bash
# 1. コードの復旧
git checkout main
git pull origin main

# 2. 依存関係の復旧
npm install

# 3. 環境変数の復元
cp .env.production .env.local

# 4. デプロイ
npm run build
npm run start
```

## スケーリング

### 1. 水平スケーリング

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 2. データベースのスケーリング

```sql
-- 読み取り専用レプリカの設定
-- Supabase の「Settings」→「Database」→「Replicas」
```

### 3. CDN の設定

```javascript
// next.config.js
const nextConfig = {
  // 静的アセットの最適化
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.your-domain.com' : '',
};
```

## メンテナンス

### 1. 定期メンテナンス

```bash
# 依存関係の更新
npm update
npm audit fix

# データベースの最適化
npm run db:optimize
```

### 2. 監視アラート

```typescript
// lib/monitoring.ts
export const setupAlerts = () => {
  // エラー率の監視
  // レスポンス時間の監視
  // データベース接続数の監視
};
```

### 3. ログローテーション

```bash
# ログファイルのローテーション
logrotate /var/log/app.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
}
```
