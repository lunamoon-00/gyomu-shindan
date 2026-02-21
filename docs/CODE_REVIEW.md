# 業務効率化診断ツール コードレビュー

実務品質に近づけるためのレビュー結果です。壊れにくさ・保守性・整合性・UX を中心にチェックしました。

---

## 1. 総評

### 良い点

| 項目 | 内容 |
|------|------|
| **責務の整理** | テーマ（themes/efficiency）、設定（config）、ログ（logger）が分離されており、構造が分かりやすい |
| **エラーハンドリング** | API で res.ok チェック、JSON パース失敗時のハンドリング、normalizeApiResponse による型ガードが入っている |
| **二重送信防止** | handleSubmit と handleConsult の両方で実装されている |
| **バリデーション** | 必須・数値（NaN 含む）のチェックが入っており、data-field によるスクロール連動も実装済み |
| **ROI 整合性** | 慎重 <= 標準 <= 積極 を保証し、不整合時はログ＋フォールバックしている |
| **ログ設計** | 個人情報を出さず、phase/tag で追跡しやすい形式になっている |
| **再送導線** | エラー時に「もう一度送信する」ボタンがあり、状態もリセットされている |

### リスクの高い点

| 項目 | 内容 |
|------|------|
| **機密情報のハードコード** | GAS URL・メールアドレスが config.ts にフォールバックとして直書き。リポジトリ公開時に露出する |
| **結果画面の「試算」表記なし** | KPI・ROI が試算値であることが明示されておらず、実数と誤解される可能性 |
| **相談フォームのメール形式エラー** | 不正なメール形式で送信してもエラーメッセージが出ず、ユーザーが原因を把握しづらい |
| **KPI の固定値** | totalWeeklyHours / monthlyLaborCost / difficultyScore が API レスポンスを使わず固定値。将来の API 拡張と不整合になりうる |

---

## 2. 優先度つきレビュー指摘一覧

### Critical

| No | 指摘 | 理由 | 起きる問題 | 修正方針 |
|----|------|------|------------|----------|
| C1 | **GAS URL・メールのハードコード** | フォールバックとしてソースに直書きされている | リポジトリ公開時に URL・メールが露出し、スパム・悪用のリスク | フォールバックを削除し、未設定時は 503 などで明示的にエラーにする。.env の設定を必須にする |
| C2 | **結果の「試算値」表示がない** | KPI・ROI が試算・目安であることが画面に書かれていない | ユーザーが実数と誤解し、トラブルの元になりうる | 結果画面に「※試算値・目安です」等の注釈を追加する |

### High

| No | 指摘 | 理由 | 起きる問題 | 修正方針 |
|----|------|------|------------|----------|
| H1 | **相談フォーム：メール形式エラー時になにも表示されない** | 不正メール形式で送信しても `return` するだけで UI に反映されない | ユーザーが「送れない理由」を理解できない | 親コンポーネントに error を渡すか、ConsultationForm 内でローカル error を表示する |
| H2 | **handleConsult で res.ok の前に JSON パース** | 4xx/5xx でもレスポンスをパースしてから res.ok を判定している | エラー時にパースで例外が出る可能性は低いが、順序として res.ok を先に見る方が安全 | res.ok を先にチェックし、false のときはパースせずエラーメッセージを返す |
| H3 | **validationErrors が入力修正で即時クリアされない** | エラー解消後も、再送信するまで赤枠が残る | ユーザーが「まだエラーがある」と誤認しうる | onChange で該当フィールドのエラーをクリアする（任意。再送信時にまとめてクリアする現状でも運用上は問題になりにくい） |

### Medium

| No | 指摘 | 理由 | 起きる問題 | 修正方針 |
|----|------|------|------------|----------|
| M1 | **KPI が API レスポンスと無関係** | totalWeeklyHours, monthlyLaborCost, difficultyScore が固定値 | GAS 側で実装してもフロントで使われず、将来の拡張で不整合になる | apiResponseToResultData で API から渡ってきた値を使い、未定義時のみフォールバックとする |
| M2 | **formCompany / formContact が空のときの表示** | 両方空だと「 様」だけになる | 見た目が不自然になる | 空の場合は「様」を出さない、または「お客様」などの代替表示にする |
| M3 | **スクロールと currentStep のずれ** | scrollToNext で `Math.min(s + 1, 10)` を使用。TOTAL_STEPS は 9 | 10 はボタンセクション用なので実害は小さいが、マジックナンバー | 定数化するか、TOTAL_STEPS + 1 など意図をコメントで明示する |
| M4 | **API レスポンスの status が error のときの data** | result.status === "error" でも result に bottleneckTask 等が入っている可能性 | handleConsult では status チェック済みなので大きな問題はない | 型で success 時にのみ payload を持つようにする（将来の型強化で対応可能） |

### Low

| No | 指摘 | 理由 | 起きる問題 | 修正方針 |
|----|------|------|------------|----------|
| L1 | **Step 遷移時のバリデーションなし** | 「次へ」で未入力のまま進める | 最後の送信時にまとめてエラー表示になる。意図的なら許容可 | 必要であればステップごとの簡易バリデーションを追加 |
| L2 | **IT ツール等のボタンが emerald** | 一部で emerald が残っている | 他は navy に統一されているため、デザインのばらつき | デザイン統一のタイミングで navy に揃える |
| L3 | **ConsultationForm の confirm** | window.confirm で確認している | ネイティブダイアログで UX がやや重い。機能的には問題なし | 将来的にモーダルコンポーネントに差し替える検討 |

---

## 3. まず直すべき上位 3 つ

| 順位 | 指摘 | 理由 |
|------|------|------|
| 1 | **C1: 機密情報のハードコード削除** | セキュリティ・運用リスクが高い。リポジトリ公開時や本番運用時に影響する |
| 2 | **C2: 試算値であることの明示** | ユーザー誤解によるトラブルを防ぐため。表示の追加だけで済む |
| 3 | **H1: 相談フォームのメール形式エラー表示** | 送信できない原因が分からず離脱するのを防ぐ。修正範囲も小さい |

---

## 4. 差分ベースの修正案

### 4.1 C1: 機密情報のフォールバック削除

**ファイル:** `lib/config.ts`

**置換:**

```typescript
// 変更前
export function getGasUrl(): string {
  const fromEnv = process.env.GAS_URL?.trim();
  if (fromEnv) return fromEnv;
  return "https://script.google.com/...";  // 削除
}

export function getConsultEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONSULT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return "b8szsuut4n@yahoo.co.jp";  // 削除
}
```

```typescript
// 変更後
export function getGasUrl(): string {
  return process.env.GAS_URL?.trim() ?? "";
}

export function getConsultEmail(): string {
  return process.env.NEXT_PUBLIC_CONSULT_EMAIL?.trim() ?? "";
}
```

**補足:** `.env.local` の設定が必須になります。未設定時は診断送信・相談送信でエラーになります。`.env.example` と README で設定手順を明記してください。

---

### 4.2 C2: 試算値の注釈追加

**ファイル:** `components/diagnosis/ResultKpiCards.tsx`

**追加箇所:** `<p className="text-xs text-navy-500 mb-1">{card.label}</p>` の直前に、1 行追加

```tsx
{/* 追加: KPI セクションの直前に */}
<p className="text-xs text-navy-500 mb-3">
  ※試算値・目安です。実際の数値は状況により異なります。
</p>
```

**ファイル:** `components/diagnosis/RoiCards.tsx`

**追加箇所:** `<p className="text-sm font-medium text-navy-600">` のラベル下に

```tsx
{/* 変更前 */}
<p className="text-sm font-medium text-navy-600">
  削減見込み（円/月）
</p>

{/* 変更後 */}
<p className="text-sm font-medium text-navy-600">
  削減見込み（円/月）
</p>
<p className="text-xs text-navy-500 mb-2">※試算値です</p>
```

---

### 4.3 H1: 相談フォームのメール形式エラー表示

**ファイル:** `components/diagnosis/ConsultationForm.tsx`

**置換:**

```tsx
// 変更前
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!email.trim() || isSending || isSent) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return;  // 何も表示されない
  }
  ...
};
```

```tsx
// 変更後
const [localError, setLocalError] = useState<string | null>(null);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLocalError(null);
  if (!email.trim() || isSending || isSent) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    setLocalError("正しいメールアドレスを入力してください。");
    return;
  }
  if (!window.confirm("相談リクエストを送信しますか？")) return;
  await onSubmit(email);
};
```

表示は `{error && ...}` の隣に `{localError && <p className="text-sm text-red-600">{localError}</p>}` を追加。

---

## 5. テストチェックリスト（手動確認用）

### 正常系

- [ ] 必須項目をすべて入力して送信 → 結果モーダルが表示される
- [ ] 結果画面の KPI・ROI・ロードマップが表示される
- [ ] 相談フォームに正しいメールを入力して送信 → 成功メッセージが表示される
- [ ] モーダルの「閉じる」でフォームに戻れる
- [ ] NEXT_PUBLIC_USE_MOCK=true でモック診断が動作する

### 異常系

- [ ] 必須項目を空のまま送信 → エラーメッセージが表示され、最初のエラー項目にスクロールする
- [ ] 実施回数に "abc" を入力して送信 → 「1以上で入力してください」が表示される
- [ ] 送信中にボタン連打 → 1 回しか送信されない
- [ ] 診断送信失敗（ネットワークオフ等）→ エラーモーダルと「もう一度送信する」が表示される
- [ ] 相談で不正メール形式（例: "a"）を入力して送信 → エラーメッセージが表示される
- [ ] GAS_URL 未設定で診断送信 → 503 または適切なエラーメッセージが返る

### 境界値

- [ ] 担当人数 1、実施回数 1、作業時間 1 で送信 → 成功する
- [ ] 担当人数 100、実施回数 999、作業時間 999 で送信 → 成功する（バリデーション範囲内）
- [ ] 実施回数 0 で送信 → エラーになる
- [ ] 空の会社名（スペースのみ）で送信 → エラーになる

---

## 6. 将来の改善候補（今回必須ではない）

| 項目 | 内容 |
|------|------|
| **型の強化** | ApiResponse を success/error で判別可能な union 型にする |
| **テスト自動化** | validateForm, apiResponseToResultData のユニットテスト、E2E テストの追加 |
| **DB 保存** | 診断結果を DB に永続化し、後から分析・レポートに利用する |
| **認証** | 送信前の認証・レート制限の導入 |
| **監視** | エラー率の監視・アラートの設定 |
| **ステップバリデーション** | 「次へ」押下時にそのステップの必須チェックを行う（任意） |
| **PDF/スライド生成** | GAS 側で生成し、slidesUrl でダウンロードリンクを提供 |
| **多言語対応** | エラーメッセージ等の定数化と i18n の検討 |
| **page.tsx の分割** | カスタムフック化などで行数削減と責務の整理 |
