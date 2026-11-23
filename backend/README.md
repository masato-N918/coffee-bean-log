# coffee-bean-log バックエンド

Python + FastAPI で作るバックエンド API です。パッケージ管理には [uv](https://docs.astral.sh/uv/) を使います。

## 必要なもの

- uv（Python 3.14 は uv が用意します）

## セットアップ

```bash
cd backend
uv sync
```

## 起動

```bash
uv run fastapi dev app/main.py
```

- ヘルスチェック: http://127.0.0.1:8000/api/health → `{"status":"ok"}`
- API ドキュメント（Swagger UI）: http://127.0.0.1:8000/docs

## テスト・コードチェック

```bash
uv run pytest                 # テスト
uv run ruff check .           # リント
uv run ruff format .          # フォーマット
```

## ディレクトリ構成

```
backend/
├── app/
│   ├── main.py          # FastAPI アプリの生成・ルーターの登録
│   └── routers/         # 機能ごとの API（例: health.py）
└── tests/               # テスト
```
