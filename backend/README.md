# coffee-bean-log バックエンド

Python + FastAPI で作るバックエンド API です。パッケージ管理には [uv](https://docs.astral.sh/uv/) を使います。

## 必要なもの

- uv（Python 3.14 は uv が用意します）
- Docker（ローカルの MySQL 8.4 を動かすため）

## セットアップ

```bash
cd backend
uv sync
```

## DB（MySQL）の準備

1. `.env` を2つ作る（どちらも Git には含めない）

   ```bash
   # リポジトリ直下：docker compose が使う
   cp .env.example .env
   # backend：バックエンドが使う
   cp backend/.env.example backend/.env
   ```

   - パスワードは自分で決めた値に変える。`backend/.env` の `DATABASE_URL` のパスワードは、リポジトリ直下の `.env` の `MYSQL_PASSWORD` と同じにする

2. MySQL を起動する（リポジトリ直下で実行）

   ```bash
   docker compose up -d      # 起動（初回はイメージをダウンロード）
   docker compose ps         # STATUS が healthy になれば準備完了
   docker compose down       # 停止（データはボリュームに残る）
   docker compose down -v    # 停止してデータも削除
   ```

3. マイグレーション（テーブルの作成・変更）は Alembic で行う（`backend` で実行）

   ```bash
   uv run alembic upgrade head   # 最新の状態までテーブルを作る・変える
   uv run alembic current        # 今の DB の状態を確認（DB に接続できるかの確認にも使える）
   ```

   初回は `upgrade head` で `beans`（豆）と `brew_records`（抽出記録）のテーブルが作られる。

   モデル（`app/models/`）を変えたときは、マイグレーションファイルを自動生成し、中身を確認してから適用する。生成したファイルは ruff で自動的に整形される（`alembic.ini` の `post_write_hooks`）。

   ```bash
   uv run alembic revision --autogenerate -m "変更内容"   # モデルとDBの差分からファイルを作る
   uv run alembic upgrade head                             # 適用する
   uv run alembic downgrade -1                             # 1つ前に戻す
   ```

## 起動

```bash
uv run fastapi dev app/main.py
```

- ヘルスチェック: http://127.0.0.1:8000/api/health → `{"status":"ok"}`
- API ドキュメント（Swagger UI）: http://127.0.0.1:8000/docs

## API 一覧

| メソッド | パス | 内容 | 成功時 |
|------|------|------|------|
| GET | `/api/health` | ヘルスチェック | 200 |
| GET | `/api/beans` | 豆の一覧（新しい順） | 200 |
| POST | `/api/beans` | 豆の登録 | 201 |
| GET | `/api/beans/{id}` | 豆の詳細 | 200 |
| PUT | `/api/beans/{id}` | 豆の編集（全項目を送る） | 200 |
| DELETE | `/api/beans/{id}` | 豆の削除（その豆の抽出記録も削除） | 204 |

- 入力チェックに合わない値は 422、存在しない id は 404 を返す。
- 焙煎度は、`roast_level`（8段階）だけ送ると `roast_group`（呼び方）が自動で入る。組み合わせが食い違うと 422。

## テスト・コードチェック

テストは開発用の MySQL に接続して行う（各テストは最後にロールバックするので、データは残らない）。先に MySQL を起動し、`uv run alembic upgrade head` を済ませておく。

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
│   ├── config.py        # 設定（.env の DATABASE_URL など）の読み込み
│   ├── database.py      # DB 接続（engine・セッション・モデルの親クラス Base）
│   ├── models/          # テーブルの定義（bean.py・brew_record.py、選択肢のコード値は choices.py）
│   ├── schemas/         # API の入力・出力の形と入力チェック（Pydantic）
│   └── routers/         # 機能ごとの API（health.py・beans.py）
├── migrations/          # Alembic のマイグレーション
│   ├── env.py           # Alembic の設定（.env から接続先を読む）
│   └── versions/        # マイグレーションファイル
├── alembic.ini          # Alembic の設定ファイル
└── tests/               # テスト
```
