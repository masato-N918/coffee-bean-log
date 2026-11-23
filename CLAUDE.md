# coffee-bean-log 開発ガイド（Claude Code 用）

このリポジトリで作業するときの開発ルールです。Claude Code はこのファイルの内容に従って作業します。

## ブランチ運用（最重要）

- **`main` へ直接コミット・プッシュしない。** `main` はGitHubのルールセットで保護されており、直プッシュは拒否されます。
- 変更は**必ずGitHub Issueを立て、そのIssueに紐づくブランチ**を切って行います。
- `main` への反映は**PR（プルリクエスト）経由のマージのみ**です。

### ブランチ命名規則

`<種別>/issue-<番号>-<内容>`

| 種別 | 用途 |
| --- | --- |
| `feature/` | 新機能の追加 |
| `fix/` | バグ修正 |
| `docs/` | ドキュメントの変更 |
| `refactor/` | リファクタリング |
| `chore/` | 設定・ビルド・雑務 |

例:
- `feature/issue-12-add-bean-list`
- `fix/issue-15-rating-validation`
- `docs/issue-1-requirements`

## 作業の流れ

```bash
# 1. Issueを立てる（番号を確認）
gh issue create

# 2. mainを最新化
git switch main
git pull --ff-only

# 3. Issueに紐づくブランチを切る
git switch -c feature/issue-<番号>-<内容>

# 4. 変更してコミット（本文に "Closes #<番号>" を書くとマージ時にIssueが自動クローズ）
git add -A
git commit

# 5. ブランチをpush
git push -u origin feature/issue-<番号>-<内容>

# 6. PRを作成
gh pr create

# 7. マージ後、ブランチを削除
gh pr merge --delete-branch
```

- コミットメッセージやPR本文に `#<番号>` を書くとIssueに紐づきます。
- `Closes #<番号>` / `Fixes #<番号>` と書くと、マージ時にIssueが自動でクローズされます。

## GitHub設定メモ

- リポジトリは **public**。
- `main` はリポジトリルールセット `protect-main` で保護済み。
  - 直プッシュ禁止（PR経由のみ）
  - ブランチ削除禁止・force-push禁止
  - レビュー承認数は **0**（ソロ開発のため、自分でPRをマージ可能）
  - オーナー（管理者）にも適用（バイパスなし）

## プロジェクト概要

コーヒー豆と、その豆を淹れた記録（抽出記録）を管理するアプリ。

- フロントエンド: Vue 3 + TypeScript
- バックエンド: Python + FastAPI（パッケージ管理は uv）
- データベース: MySQL（本番は RDS for MySQL）
- 本番環境: AWS（EC2 1台 + RDS for MySQL）。インフラは Terraform で管理する
  - 常時稼働はしない。`terraform apply` は課金が発生するため、ユーザーの指示があるときだけ実行し、動作確認・スクショ撮影が終わったら `terraform destroy` で削除する

## 補足

- このプロジェクトはスクールの学習課題（初級編の最終課題）です。これまでの課題（`raisetech_ai`：React / Java / Spring Boot / PostgreSQL）とは**異なる技術スタック**を使うことが条件です。
- 一度に作り込まず、1ステップずつ段階的に進めます。
- 完成報告は URL ではなくスクリーンショットで行います。
- ユーザーに見える確認メッセージなどは日本語で記述します。
