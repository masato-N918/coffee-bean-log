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

## テストデータ

画面の確認用に、豆10件と抽出記録6件を入れられる（焙煎度・評価・産地・抽出記録の有無などのパターンをそろえてある）。

```bash
uv run python -m scripts.seed          # テストデータを追加（同じ名前の豆があれば飛ばす）
uv run python -m scripts.seed --reset  # 豆と抽出記録をすべて消してから入れ直す
```

## API 一覧

| メソッド | パス | 内容 | 成功時 |
|------|------|------|------|
| GET | `/api/health` | ヘルスチェック | 200 |
| GET | `/api/beans` | 豆の一覧（絞り込み・並び替えはクエリパラメータで指定） | 200 |
| POST | `/api/beans` | 豆の登録 | 201 |
| GET | `/api/beans/{id}` | 豆の詳細 | 200 |
| PUT | `/api/beans/{id}` | 豆の編集（全項目を送る） | 200 |
| DELETE | `/api/beans/{id}` | 豆の削除（その豆の抽出記録も削除） | 204 |
| GET | `/api/beans/{bean_id}/brew-records` | その豆の抽出記録の一覧（抽出日の新しい順） | 200 |
| POST | `/api/beans/{bean_id}/brew-records` | 抽出記録の登録 | 201 |
| GET | `/api/brew-records/{id}` | 抽出記録の取得 | 200 |
| PUT | `/api/brew-records/{id}` | 抽出記録の編集（全項目を送る） | 200 |
| DELETE | `/api/brew-records/{id}` | 抽出記録の削除 | 204 |

- 入力チェックに合わない値は 422、存在しない id は 404 を返す。
- 焙煎度は、`roast_level`（8段階）だけ送ると `roast_group`（呼び方）が自動で入る。組み合わせが食い違うと 422。
- 抽出記録の豆の量・湯量は、数値と単位をセットで送る（片方だけは 422）。範囲は単位ごとに異なる（豆の量 g: 0.1〜1000 / 杯: 0.5〜20、湯量 ml: 1〜5000 / 杯: 1〜20）。

### 豆一覧のクエリパラメータ

| パラメータ | 内容 | 例 |
|------|------|------|
| `origin` | 産地の部分一致（100文字以内） | `origin=エチオピア` |
| `roast_group` | 焙煎度の呼び方。複数指定可。8段階で登録した豆も対象 | `roast_group=light&roast_group=medium` |
| `roast_level` | 焙煎度 8段階。複数指定可。その段階で登録した豆だけ | `roast_level=city` |
| `min_rating` | 評価がこの値以上（1〜5）。未評価の豆は出ない | `min_rating=3` |
| `sort` | `newest`（新しい順・初期値）/ `rating`（評価の高い順。同じ評価は新しい順、未評価は最後） | `sort=rating` |

- 条件同士は AND。`roast_group` と `roast_level` を両方指定したときは、どちらかに当てはまる豆を返す（OR）。

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
│   └── routers/         # 機能ごとの API（health.py・beans.py・brew_records.py）
├── migrations/          # Alembic のマイグレーション
│   ├── env.py           # Alembic の設定（.env から接続先を読む）
│   └── versions/        # マイグレーションファイル
├── scripts/
│   └── seed.py          # 開発用のテストデータを入れる
├── alembic.ini          # Alembic の設定ファイル
└── tests/               # テスト
```
