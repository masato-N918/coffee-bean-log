---
name: quality-check
description: coffee-bean-log（コーヒー豆と抽出記録の記録アプリ：Vue 3 + TypeScript / FastAPI + uv / MySQL、本番は AWS を Terraform で構築）の品質チェックを行う。lint・型チェック・ビルド・テスト・依存の脆弱性チェック（Terraform があれば fmt / validate も）を実行し、要件定義書などの docs/ と実装の食い違い、バグ、デファクトスタンダードやベストプラクティスからのずれを洗い出して、優先度つきで報告する。「品質チェックして」「レビューして」「lint かけて」「よくない点を指摘して」「ベストプラクティスから外れていないか見て」「ドキュメントと実装がずれていないか確認して」など、コードの品質・正しさ・規約への適合を確かめたい依頼では、対象範囲や言い方が違っても必ずこのスキルを使うこと。
---

# 品質チェック（coffee-bean-log）

このプロジェクトの品質を、**機械的なチェック**と**人の目でのレビュー**の両方から確認し、直すべき点を優先度つきで報告するためのスキル。

このプロジェクトはスクールの学習課題（初級編の最終課題）で、1ステップずつ段階的に作っている。指摘は「次に何を直せばよいか」が分かる形にし、学習者が理解できるように**なぜ問題なのか**を添える。

## 基本方針

- **修正はしない。報告までを行う。** 直すかどうか・どの順で直すかはユーザーが決める。直す場合は CLAUDE.md の運用（Issue → ブランチ → PR）に従い、別の作業として進める。
  - plan モードで呼ばれた場合は、報告内容を計画ファイルに書く。
- **チェックでファイルを書き換えない。** `npm run lint`（`--fix` 付き）や `npm run format`、`ruff format`（`--check` なし）は使わない。終わったら `git status` で作業ツリーが変わっていないことを確かめる。
- **推測で指摘しない。** バグとして挙げるものは、コードの流れを実際に追い、「どういう操作をすると何が起きるか」を具体的に書けるものだけにする。確信が持てないものは「要確認」と明記する。
- **lint の出力をそのまま並べない。** 誤検知や実害の小さい警告は除外し、意味のあるものだけを要約する（後述）。
- **段階的に作っている途中であることを考慮する。** `docs/機能要件.md` で「未実装」「将来拡張」となっている機能が無いことは指摘しない（状態列と実装のずれは指摘する）。
- ユーザーに見せる文章とコマンドの説明はすべて日本語で書く。

## 手順

### 0. 対象範囲の確認

依頼で範囲が指定されていればそれに従う（例：「フロントだけ」「今のブランチの変更だけ」）。指定がなければリポジトリ全体を対象にする。

- ブランチの差分だけを見る場合：`git diff main...HEAD --stat` と `git diff main...HEAD`
- 既存の Issue と同じ指摘を重ねて出さないよう、`gh issue list --state open` で未対応の Issue を確認しておく。既に Issue がある指摘は「Issue #番号 で対応予定」と添える。

### 1. 機械的なチェック

以下を実行し、結果を記録する。1つが失敗しても残りは続ける。

**フロントエンド**（`frontend/` で実行。**PowerShell ツールで実行する**。Git Bash から vitest を実行すると全件失敗するため）

| チェック | コマンド | 備考 |
|---|---|---|
| lint（oxlint） | `npx oxlint .` | `npm run lint` は `--fix` 付きなので使わない |
| lint（ESLint） | `npx eslint .` | 同上。0 件であることを確認 |
| 書式 | `npx prettier --check src/` | 差分のあるファイル名が出る |
| 型チェック＋ビルド | `npm run build` | `vue-tsc --build` を含む |
| テスト | `npx vitest run` | `npm run test:unit` はウォッチモードで終わらないので使わない |
| lint（拡張ルール） | `npx oxlint --vue-plugin --jsx-a11y-plugin -W suspicious -W perf src` | プロジェクト設定より厳しい観点。下の除外ルールで絞り込む |
| 依存の脆弱性 | `npm audit` | |

拡張ルールの結果は、誤検知や実害の小さいもの（`.vue` のテンプレートを解析できずに出る警告、このアプリの規模では効果のない性能系の提案など）を除外してから、ルールごとに件数を数える。残った警告は代表的な箇所と「何が問題か」を添える。

**バックエンド**（`backend/` で実行）

| チェック | コマンド | 備考 |
|---|---|---|
| lint | `uv run ruff check .` | `--fix` は付けない |
| 書式 | `uv run ruff format --check .` | 差分のあるファイル名が出る |
| テスト | `uv run pytest` | DB を使うテストは開発用の MySQL が必要（`tests/conftest.py`）。リポジトリ直下で `docker compose ps` を見て、MySQL が動いていなければ「DB 未起動のため未実行」と報告する（**DB を勝手に起動しない**）。DB を使わないテストだけでも結果があれば書く |
| モデルとマイグレーションの差分 | `uv run alembic check` | DB が起動しているときだけ。差分があると、モデルを変えたのにマイグレーションを作り忘れている |
| 依存の脆弱性 | `uv export --format requirements-txt --no-hashes \| uvx pip-audit -r /dev/stdin` など | 実行できなければ「未実行（理由）」と書く |

Python の型チェッカー（mypy / pyright）が `pyproject.toml` に入っているか確認し、入っていれば実行する。入っていなければ「未導入」として報告に含める。

**インフラ・デプロイ**（`terraform/`、`scripts/`）

`terraform/` や `scripts/` がまだ無ければ「未作成のため対象外」と書いて次へ進む。あれば次を実行する。

| チェック | コマンド | 備考 |
|---|---|---|
| Terraform の書式 | `terraform -chdir=terraform fmt -check -recursive` | Windows には `diff` がないので `-diff` は付けない |
| Terraform の構文・参照 | `terraform -chdir=terraform validate` | 未初期化なら先に `terraform -chdir=terraform init -backend=false`（AWS には接続しない） |
| Terraform の lint | `tflint --chdir=terraform` | 未インストールなら「未導入」と報告する |
| Terraform のセキュリティ | `trivy config terraform` または `checkov -d terraform` | 未インストールなら「未導入」と報告し、[checklist.md](references/checklist.md) の 6 章の観点で目視する |
| PowerShell の構文・文字コード | `[Management.Automation.Language.Parser]::ParseFile(...)` でエラー 0 件か、先頭 3 バイトが `EF BB BF`（UTF-8 BOM）か | Windows PowerShell 5.1 は BOM なしの UTF-8 を Shift_JIS として読む |
| シェルスクリプトの lint | `shellcheck`（`*.tftpl` は `$${` → `${` に置き換えてから渡す） | 未インストールなら「未導入」と報告し、目視する |
| 改行コード | `git ls-files --eol terraform scripts` | EC2 で実行する `*.tftpl` / `*.sh` が `i/lf` であること |

**`terraform plan` / `apply` は実行しない。** plan は AWS に接続し、apply は課金が発生する。必要なら報告の中で「plan での確認を推奨」と書くにとどめる。

**リポジトリ全体**

- 秘密情報の混入：`git ls-files` に `.env`（`.env.example` 以外）・`*.tfstate`・`*.tfvars`（`.example` 以外）が含まれていないか。差分にパスワード・IP アドレス・AWS アカウント ID・アクセスキー（`AKIA`）・秘密鍵が含まれていないか
- `.env.example`（ルートと `backend/`）が、実際に読み込んでいる設定（`backend/app/config.py`、`docker-compose.yml`）と合っているか
- CI（`.github/workflows/`）があるか、`.editorconfig` がリポジトリ全体（Python を含む）をカバーしているか
- VS Code の診断（`mcp__claude-vscode__getDiagnostics`）が使えれば補助的に見る。ただし開いていないファイルは解析されないことがあるので、空でも「問題なし」とは言い切らない

### 2. ドキュメントと実装の整合性

`docs/` は要件・設計の正となる文書で、[要件定義書.md](../../../docs/要件定義書.md) が中央ドキュメント。次の対応を確認する：

| ドキュメント | 実装側で照らし合わせる場所 |
|---|---|
| `docs/機能要件.md` の F-01〜F-16 と「状態」列（実装済み／未実装／将来拡張） | 実際にその機能が動くコード（`backend/app/routers/`、`frontend/src/views/`）があるか。実装済みなのに「未実装」のまま、またはその逆になっていないか |
| `docs/機能要件.md` の入力項目・選択肢・絞り込み・並び替えの仕様 | `backend/app/schemas/`（Pydantic の制約）、`frontend/src/forms/`（入力チェック）、`frontend/src/constants/choices.ts`、ルーターのクエリパラメータ |
| `docs/画面設計書.md` の画面一覧（S-1〜）・画面遷移図・ワイヤーフレーム | `frontend/src/router/index.ts`、`frontend/src/views/`、`frontend/src/components/`。ボタン・操作・無効になる条件・文言・遷移先 |
| `docs/データ設計書.md` のテーブル定義・選択肢の保存値 | `backend/app/models/`、`backend/migrations/versions/`、`backend/app/schemas/`、`frontend/src/types/`、`frontend/src/constants/choices.ts`、`backend/app/models/choices.py` |
| `docs/非機能要件.md`（ユーザビリティ・誤操作防止・セキュリティなど） | 削除時の確認ダイアログ、入力検証、エラー表示、文字数制限 |
| `docs/要件定義書.md` の技術スタック・バージョン・改訂履歴 | `frontend/package.json`、`frontend/.node-version`、`backend/pyproject.toml`、`backend/.python-version`、`docker-compose.yml` |
| `README.md`・`backend/README.md`・`frontend/README.md` の起動手順・API 一覧 | 実際の起動コマンド、ルーターの `@router.get` などのパスとメソッド |
| `mock/index.html`（画面モック） | 実装した画面の構成・文言（モックと違う場合、どちらが新しい決定か画面設計書で確認する） |
| （作成後）インフラ設計書 | `terraform/*.tf`、`scripts/`。図にあるリソースや通信が実在するか、手順のコマンドがそのまま動くか |

食い違いを見つけたら、「どちらが正しいか」も判断して書く（多くは実装が進んでドキュメントが古いだけ。逆に、ドキュメントの仕様どおりに実装されていない場合はバグとして扱う）。

### 3. コードレビュー（バグ・ベストプラクティス）

全ソースを読む（規模が小さいので、ファイルを絞り込まずに通して読むほうが取りこぼしが少ない）。特に次の観点で見る。観点ごとの具体的な確認項目は [references/checklist.md](references/checklist.md) にある。必要に応じて読むこと。

- **状態が組み合わさったときの不具合**：絞り込み中 × 並び替え、送信中 × 再操作（連打）、削除の確認ダイアログ × 画面遷移、エラー × 再取得、同じコンポーネントでのルートパラメータ変更（`/beans/1` → `/beans/2`、登録 ↔ 編集）など。単独の機能では正しくても、組み合わせると壊れることが多い
- **フロントとバックの前提のずれ**：`frontend/src/types/` と `backend/app/schemas/` の型・必須／任意・null の扱いが合っているか。クエリパラメータの名前と形式（複数選択の渡し方など）が合っているか。選択肢の保存値が両側でそろっているか
- **データの整合性**：commit / rollback の位置、豆を消したときの抽出記録の扱い（`ON DELETE CASCADE` とリレーションの `cascade` 設定）、並び順（`ORDER BY` の根拠になっている列が本当に順序を表すか、同じ値のときの順序が安定しているか）
- **エラー処理**：エラーがユーザーに見えるか、すぐ消えないか、API のエラーレスポンスの形式（FastAPI の `detail`）がそろっていて、フロント（`frontend/src/api/errors.ts`）がそれを正しく解釈しているか
- **デファクトスタンダードからのずれ**：Vue 3（Composition API / `<script setup>`）/ TypeScript / Pinia / Vue Router / FastAPI / SQLAlchemy 2.x / Pydantic v2 / Alembic / MySQL で一般的なやり方と比べてどうか。ずれていても学習目的の方針として要件定義書に明記されているものは指摘しない
- **テスト・CI・静的解析の有無**
- **インフラとデプロイ**（作成後）：通信の許可が最小限か、秘密情報がどこに残るか、作り直し・再実行しても同じ結果になるか（冪等性）、Windows（PowerShell 5.1・OpenSSH）と Linux（EC2）の違いで壊れないか。学習用途として要件定義書・非機能要件で許容している制約（HTTP のみ、シングル AZ、常時稼働しない など）は指摘しない

## 報告の形式

次の構成で報告する。指摘には必ず `ファイル:行` へのリンク（`[BeanListView.vue:42](frontend/src/views/BeanListView.vue#L42)` の形）を付ける。

```markdown
## 実行したチェックの結果
| チェック | 結果 |
|---|---|
（コマンドごとに 1 行。0 件なら「0 件」と書く。実行できなかったものは理由を書く）

## A. バグ（優先度：高）
1. **（何が起きるかを一言で）** — [ファイル:行](リンク)
   （どういう操作で起きるか → なぜ起きるか → 対策の方向性）

## B. ドキュメントと実装のずれ
- （どのドキュメントのどこが、実装とどう違うか。どちらに合わせるべきか）

## C. ベストプラクティスとのずれ（優先度：中〜低）
（バックエンド／フロントエンド／インフラ・デプロイ／リポジトリ全体に分けて、なぜそれが一般的なのかを 1 文で添える）

## 修正の進め方（提案）
（1 Issue ＝ 1 PR の単位で、おすすめの順番に並べる。ブランチの種別（fix/ docs/ chore/ refactor/）も添える）
```

報告の最後に、**最初に何から手をつけるとよいか**を理由つきで1つだけ勧める。
