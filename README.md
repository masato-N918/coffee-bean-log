# coffee-bean-log

買ったコーヒー豆と、その豆を淹れた記録（抽出方法・味の評価・メモ）を残す、**コーヒー豆の記録アプリ**です。

> スクールの学習課題として開発しています。一度に作り込まず、1ステップずつ段階的に進めています。

## 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | Vue 3.5 + TypeScript 6.0（Node.js 26 LTS / Vite 8） |
| バックエンド | Python 3.14 + FastAPI 0.165（uv） |
| データベース | MySQL 8.4 LTS（本番は RDS for MySQL） |
| 本番環境 | AWS（EC2 + RDS） |
| インフラ構築 | Terraform 1.17 |

バージョンの選定理由は [要件定義書](docs/要件定義書.md#61-バージョン) を参照してください。

## 開発環境での起動

### バックエンド

```bash
cd backend
uv sync
uv run fastapi dev app/main.py
```

http://127.0.0.1:8000/api/health で `{"status":"ok"}` が返れば起動できています。詳しくは [backend/README.md](backend/README.md) を参照してください。

## 開発ワークフロー

`main` への直接コミットは禁止です。変更は **Issue を立て → ブランチを切り → PR 経由でマージ** します。
詳細は [CLAUDE.md](CLAUDE.md) を参照してください。
