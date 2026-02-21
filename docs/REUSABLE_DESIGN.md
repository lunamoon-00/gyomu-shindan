# 診断ツール 再利用設計ガイド

「別案件にも使い回せる構成」にするための設計方針と実装指針です。
上級者の再利用設計を学ぶための教材として、設計意図を丁寧に説明します。

---

## 1. 設計方針

### 1.1 共通化するもの

| 対象 | 理由 | 例 |
|------|------|-----|
| **フロー制御** | 診断の流れ（フォーム→送信→結果）は全テーマ共通 | バリデーション→送信→結果表示 |
| **UI骨格** | ステップ進捗・カード・ボタン等は汎用パーツ | StepProgress, FormCard |
| **送信・通信** | fetch、エラーハンドリング、モック切替は共通 | submitDiagnosis の骨格 |
| **設定・ログ** | 環境変数、ログ出力はテーマに依存しない | config, logger |

### 1.2 個別のままにするもの（テーマごと）

| 対象 | 理由 | 例 |
|------|------|-----|
| **フォーム項目** | 診断テーマによって聞く内容が違う | 業務効率化=人件費/業務名、SNS=フォロワー数/投稿頻度 |
| **バリデーションルール** | 項目に応じた必須・形式チェック | 業務効率化=週回数、SNS=アカウント種別 |
| **APIレスポンスの形** | バックエンド（GAS等）の返却形式がテーマ依存 | bottleneckTask / monthlySavedCost など |
| **結果の見せ方** | KPI・ROI・ロードマップなど表示内容がテーマ依存 | 業務効率化=ROI、SNS=エンゲージメント推移 |

### 1.3 設計の考え方

```
【共通レイヤー】lib/
  - 型の基盤（ApiResponse の status/message 程度）
  - 送信の汎用処理（fetch、res.ok、JSON パース）
  - 設定・ログ

【テーマレイヤー】themes/<テーマ名>/
  - フォーム用の型・初期値
  - 定数（選択肢など）
  - バリデーション
  - API→結果画面用のマッピング
  - メタ情報（タイトル、ステップ数）

【画面レイヤー】app/, components/
  - 共通UI（StepProgress, FormCard）
  - テーマ用UI（業務効率化なら RoiCards, RoadmapTimeline など）
  - ページは「テーマ」をインポートして組み立てる
```

---

## 2. コンポーネント/関数の責務分離案

| 責務 | 共通/個別 | 説明 |
|------|-----------|------|
| **フォームUI** | 個別 | 各テーマの入力項目・ステップ構成。共通化するのは FormCard 等のパーツ |
| **バリデーション** | 個別 | テーマごとの必須項目・数値範囲・形式 |
| **送信処理** | 共通 | エンドポイント呼び出し、エラーハンドリング。テーマは「エンドポイント」「リクエスト体」を渡す |
| **結果整形** | 個別 | API の生データ → 画面用 ResultData への変換 |
| **表示用マッピング** | 個別 | どのKPIをどう見せるか。業務効率化=ROI、SNS=別指標 |
| **通知処理** | 共通 | 相談送信の流れは共通。GAS の action やメール先は設定で切り替え |
| **定数/設定** | 混在 | エンドポイント等は共通 config、選択肢等はテーマ定数 |

---

## 3. 「診断テーマを差し替えられる」構成

### 3.1 テーマ切り替えの想定

```
themes/
  efficiency/     # 業務効率化診断（現行）
  sns/            # SNS運用診断（将来）
  automation/     # 業務自動化レベル診断（将来）
```

### 3.2 各テーマが持つもの

```
themes/efficiency/
  index.ts        # エントリ（メタ情報 + 各モジュールの集約）
  types.ts        # FormData, ApiResponse, ResultData
  constants.ts    # 選択肢（人件費、予算など）
  validation.ts   # validateForm, apiResponseToResultData
```

### 3.3 切り替え方法（将来）

- **方法A**: 環境変数 `NEXT_PUBLIC_DIAGNOSIS_THEME=efficiency` で読み込むテーマを決定
- **方法B**: ルートで切り替え `/efficiency`, `/sns` など
- **方法C**: 1プロジェクト1テーマで、別案件時はテーマフォルダだけ差し替え

まずは **方法C** がシンプルで、「別案件＝別リポジトリで themes/ だけ差し替え」も可能です。

---

## 4. 最小限のリファクタ（今回の範囲）

### 4.1 やること

1. **themes/efficiency/** を作成し、テーマ固有のものを集約
2. **lib/** は既存の型・送信・config を維持しつつ、テーマから読み込む形に変更
3. **拡張ポイント** をコメントで明示

### 4.2 やらないこと（今回）

- テーマ切り替えロジック（env やルーティング）
- 新しいテーマ（sns 等）の実装
- page.tsx の大きな構造変更

---

## 5. ファイル構成案

### 現状

```
lib/
  config.ts
  constants.ts      # 業務効率化用
  logger.ts
  submitDiagnosis.ts
  types.ts          # 業務効率化用
  validation.ts     # 業務効率化用
app/
  page.tsx
components/diagnosis/
  ...
```

### 改善後（最小リファクタ後）

```
lib/
  config.ts         # 共通設定
  logger.ts         # 共通ログ
  submitDiagnosis.ts # 共通送信（テーマの型・マッパーを参照）
  # 以下は themes/efficiency から re-export（互換性のため残す）
  constants.ts  → themes/efficiency を re-export
  types.ts      → themes/efficiency を re-export
  validation.ts → themes/efficiency を re-export

themes/
  efficiency/
    index.ts        # テーマのエントリ
    types.ts        # FormData, ApiResponse, ResultData
    constants.ts    # 選択肢
    validation.ts   # validateForm, apiResponseToResultData

app/
  page.tsx          # themes/efficiency から取得

components/diagnosis/
  ...               # 当面は変更なし
```

---

## 6. 次に共通化すべき候補（優先順位）

| 優先度 | 対象 | 理由 | 工数目安 |
|--------|------|------|----------|
| 1 | テーマフォルダの整理 | 現状の「集約」ができれば、次のテーマ追加がしやすい | 済 |
| 2 | 送信処理の抽象化 | エンドポイント・マッパーを引数化すると、テーマ差し替えが楽 | 1〜2h |
| 3 | 結果画面のコンポーネント分離 | ResultScreen を「テーマごとのレイアウト」に対応させる | 2〜3h |
| 4 | フォームの設定駆動化 | 項目定義を JSON/配列で持ち、ループで描画 | 3〜4h |
| 5 | テーマ切り替え（env/ルート） | 複数テーマを同一アプリで切り替える場合 | 2h |

---

## 7. 最小リファクタの置換ポイント（実装済み）

| ファイル | 変更内容 |
|----------|----------|
| `themes/efficiency/*` | 新規。型・定数・バリデーション・マッパーを集約 |
| `lib/types.ts` | themes/efficiency から re-export |
| `lib/constants.ts` | themes/efficiency から re-export |
| `lib/validation.ts` | themes/efficiency から re-export |
| `app/page.tsx` | THEME_META, INITIAL_FORM_DATA を theme から取得 |
| `lib/submitDiagnosis.ts` | 拡張ポイントのコメント追加 |
| `app/api/*/route.ts` | 拡張ポイントのコメント追加 |

---

## 8. 動作確認手順

1. **既存通り動作するか**
   - `npm run dev` → フォーム入力 → 送信 → 結果表示
   - タイトル「業務効率化診断」、説明「約3分で〜」が表示されること

2. **テーマ差し替えの準備ができているか**
   - `themes/efficiency/` に型・定数・バリデーションが集約されていること
   - 別テーマ追加時は `themes/sns/` を作成し、`lib/*` の import 先を差し替え

---

## 9. 将来的な拡張ポイント

以下の拡張を想定し、該当箇所にコメントを残しています。

| 拡張 | 想定場所 |
|------|----------|
| GAS API 接続 | `lib/submitDiagnosis.ts`, `app/api/diagnosis/route.ts` |
| 認証 | `app/page.tsx`（送信前）, API ルート |
| DB 保存 | GAS 側 or Next.js API ルート |
| PDF/スライド生成 | GAS 側。ApiResponse の slidesUrl で連携 |
| メール送信 | GAS 側 or 相談 API |
