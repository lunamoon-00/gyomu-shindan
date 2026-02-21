# Phase 1 安定化 実装ガイド

既存機能を壊さず、「落ちにくく・原因が追いやすい」構成にするための差分ベース実装です。

---

## 1. 改善方針（壊さないための方針）

| 方針 | 内容 |
|------|------|
| 既存UIは変更しない | ボタン・フォーム・モーダルの見た目・挙動は維持 |
| 追加のみ / 既存ロジックの拡張 | 削除は最小限。既存の成功パスはそのまま通る |
| フォールバックを用意 | 設定未設定時・想定外レスポンス時もエラーメッセージで応答 |
| ログは追跡用のみ | 個人情報は出さず、phase/タグで区切る |

---

## 2. 変更ファイル一覧

| 種別 | ファイル | 内容 |
|------|----------|------|
| 新規 | `.env.example` | 環境変数サンプル |
| 新規 | `lib/config.ts` | 設定値の取得 |
| 新規 | `lib/logger.ts` | ログ出力の共通化 |
| 変更 | `app/api/diagnosis/route.ts` | 設定参照・res.ok・ログ・例外処理 |
| 変更 | `app/api/consult/route.ts` | 同上 |
| 変更 | `lib/submitDiagnosis.ts` | 設定参照・レスポンス正規化・例外処理 |
| 変更 | `lib/validation.ts` | 数値NaNチェック・ROI整合性 |
| 変更 | `app/page.tsx` | 設定参照・二重送信防止・handleConsult改善 |

---

## 3. 環境変数の設定（必須）

**初回セットアップ:**

1. `.env.example` を `.env.local` にコピー
2. 値を設定:
   - `GAS_URL`: 既存GASのデプロイURL
   - `NEXT_PUBLIC_CONSULT_EMAIL`: 相談メールアドレス
   - `NEXT_PUBLIC_USE_MOCK`: 開発時 `true`、本番 `false`

**Vercel デプロイ時:**
- プロジェクト設定 → Environment Variables で上記3つを追加

---

## 4. 動作確認手順

### 正常系

1. **モックで診断**
   - `NEXT_PUBLIC_USE_MOCK=true` で起動
   - フォーム入力 → 送信 → 結果表示
   - 相談フォームは `NEXT_PUBLIC_CONSULT_EMAIL` 未設定なら「設定が完了していません」

2. **本番APIで診断**
   - `NEXT_PUBLIC_USE_MOCK=false`、`GAS_URL` を設定
   - フォーム入力 → 送信 → GAS経由で結果表示
   - 相談送信 → 成功メッセージ

### 異常系

3. **フォーム入力不足**
   - 必須項目を空のまま送信 → エラーメッセージ表示、該当項目へスクロール

4. **数値不正**
   - 実施回数に「abc」を入力 → 「1以上で入力してください」

5. **GAS_URL 未設定**
   - `GAS_URL` を空で診断送信 → 「サーバー設定エラー。GAS_URLが未設定です」

6. **GAS 障害（ネットワーク切りの代わり）**
   - `GAS_URL` を存在しないURLに変更 → 502 / 「診断サーバーに接続できませんでした」

7. **二重送信**
   - 送信ボタン連打 → 1回だけリクエストが飛ぶ（ローディング中は無効）

8. **相談で CONSULT_EMAIL 未設定**
   - `NEXT_PUBLIC_CONSULT_EMAIL` を空 → 「相談機能の設定が完了していません」

---

## 5. 重複の整理

- **GAS_URL**: 以前は `diagnosis/route.ts` と `consult/route.ts` に重複。`lib/config.ts` の `getGasUrl()` で統一。
- **エラーメッセージ**: API側は `status: "error"` + `message` を返す形式で統一。

---

## 6. ログの見方

開発時はターミナルに次のようなログが出ます:

```
[診断ツール] [2026-02-21T05:00:00.000Z] [diagnosis] 診断API 成功
[診断ツール] [2026-02-21T05:00:00.000Z] [diagnosis] 診断API 失敗 phase=fetch {"error":"..."}
[診断ツール] [2026-02-21T05:00:00.000Z] [gas] GAS応答がHTTPエラー {"status":502,"path":"diagnosis"}
[診断ツール] [2026-02-21T05:00:00.000Z] [roi] ROI順序不整合のためフォールバック適用 {"conservative":...,"base":...,"aggressive":...}
```

個人情報（会社名・メール等）は含みません。
