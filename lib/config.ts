/**
 * 設定値の一元管理
 * 環境変数で上書き可能。未設定時は従来値をフォールバック（後方互換）
 *
 * 【重要】
 * - NEXT_PUBLIC_* はクライアントでも参照可能（バンドルに含まれる）
 * - それ以外はサーバー専用（APIルート等）
 * - .env.local を作成して値を設定すると、フォールバックを上書き
 */

/**
 * GAS Web App URL（サーバー専用・APIルートで使用）
 * GAS_URL 未設定時は従来のURLを使用（後方互換）。.env.local で上書き推奨。
 */
export function getGasUrl(): string {
  const fromEnv = process.env.GAS_URL?.trim();
  if (fromEnv) return fromEnv;
  // 後方互換: .env 未作成時も動作させる
  return "https://script.google.com/macros/s/AKfycbxbNcKyak_Pq5VxTJfJo0A_dn60AdaG6c5mlPYxhbFr83HA2PIrsVluYhtn5xFdHM89yg/exec";
}

/**
 * 相談リクエストの送信先メール（クライアントでも使用）
 * 未設定時は従来のアドレスを使用（後方互換）
 */
export function getConsultEmail(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CONSULT_EMAIL?.trim();
  if (fromEnv) return fromEnv;
  return "b8szsuut4n@yahoo.co.jp";
}

/**
 * 診断APIをモックにするか
 * true: フォーム送信時にダミーレスポンスを返す（GAS不要）
 * false: 実際のAPIを呼ぶ
 */
export function getUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}
