# 業務効率化診断 Webフォーム 改善方針

## 1. 改善方針（何をどう変えるか）

### デザイン
- **カラースキーム**: 白ベース + 薄いラベンダー + ネイビー系アクセント（エメラルドから変更）
- **雰囲気**: やわらかく、仕事できる感じ。清潔感・信頼感・少しAIっぽさ
- **カード**: 角丸・余白広め・軽いシャドウ

### UI要素
- **ステップ進捗バー**: Step 1/9 形式で現在位置を表示
- **フォームカード**: 統一されたFormCardコンポーネントでラップ
- **次へ/戻る**: 視認性の高いボタン、戻る対応
- **必須表示**: 必須項目に「必須」バッジ
- **バリデーション**: 送信時にエラー表示

### 状態管理
- `currentStep`, `formData`, `validationErrors`, `isSubmitting`, `submitSuccess`, `submitError`, `resultData`
- 送信中ローディング、成功/失敗の明確な表示
- 失敗時の再送ボタン

### 診断結果画面（試作）
- KPIカード（総工数、月間人件費、導入難易度）
- 優先度バッジ（S/A/B）
- ボトルネック業務Top1
- ROI 3パターン
- 段階的導入ロードマップ
- 相談ボタン（既存API接続のまま）

## 2. ファイル構成案

```
app/
  page.tsx              # メイン（リファクタ）
  globals.css           # デザイントークン追加
  layout.tsx            # 変更なし

components/
  diagnosis/
    StepProgress.tsx    # ステップ進捗バー
    FormCard.tsx        # カードラッパー
    NavigationButtons.tsx  # 次へ/戻る
    ResultKpiCards.tsx  # KPIカード群
    RoiCards.tsx        # ROI 3パターン
    RoadmapTimeline.tsx # ロードマップ
    ResultScreen.tsx    # 結果画面全体
    ConsultationForm.tsx # 相談フォーム

lib/
  constants.ts          # オプション定数
  types.ts              # 型定義
  validation.ts         # バリデーション
  submitDiagnosis.ts    # 送信関数（GAS接続ポイント）
```

## 3. GAS接続時の差し替えポイント

`lib/submitDiagnosis.ts` の `submitDiagnosis()` 関数を編集：
- `USE_MOCK`: true → false に切り替え
- または環境変数 `NEXT_PUBLIC_USE_MOCK` で切り替え
