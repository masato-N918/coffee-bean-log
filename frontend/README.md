# coffee-bean-log フロントエンド

Vue 3 + TypeScript で作るフロントエンドです。Vue 公式のひな型（[create-vue](https://github.com/vuejs/create-vue)）で作成しています。

## 必要なもの

- Node.js 26 LTS（`.node-version` で指定。[fnm](https://github.com/Schniz/fnm) を使う場合は `fnm install 26` → `fnm use`）

## セットアップ

```bash
cd frontend
npm install
```

## 起動

```bash
npm run dev
```

- 画面: http://localhost:5173
- `/api` へのリクエストはバックエンド（http://127.0.0.1:8000）に転送されます（`vite.config.ts` の `server.proxy`）。
  バックエンドを起動した状態で http://localhost:5173/api/health が `{"status":"ok"}` を返せば連携できています。

## テスト・コードチェック

```bash
npm run test:unit -- --run    # テスト（Vitest）
npm run type-check            # 型チェック（vue-tsc）
npm run lint                  # リント（oxlint + ESLint）
npm run format                # フォーマット（Prettier）
npm run build                 # 本番用ビルド（dist/ に出力）
```

## ディレクトリ構成

```
frontend/
├── public/              # そのまま配信するファイル（favicon など）
└── src/
    ├── main.ts          # アプリの生成・Pinia / Router の登録
    ├── App.vue          # ルートコンポーネント
    ├── router/          # 画面のルーティング（Vue Router）
    ├── stores/          # 状態管理（Pinia）
    ├── views/           # 画面ごとのコンポーネント
    ├── components/      # 共通部品
    └── assets/          # CSS など
```
