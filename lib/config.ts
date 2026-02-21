/**
 * 設定値の一元管理
 * 環境変数から取得。未設定時は空文字を返します。
 *
 * 【重要】
 * - NEXT_PUBLIC_* はクライアントでも参照可能（バンドルに含まれる）
 * - .env.local に GAS_URL, NEXT_PUBLIC_CONSULT_EMAIL を設定してください
 */

/**
 * GAS Web App URL（サーバー専用・APIルートで使用）
 * .env.local で GAS_URL を設定してください。未設定時は空文字を返します。
 */
export function getGasUrl(): string {
  return process.env.GAS_URL?.trim() ?? "";
}

/**
 * 相談リクエストの送信先メール（クライアントでも使用）
 * .env.local で NEXT_PUBLIC_CONSULT_EMAIL を設定してください。未設定時は空文字を返します。
 */
export function getConsultEmail(): string {
  return process.env.NEXT_PUBLIC_CONSULT_EMAIL?.trim() ?? "";
}

/**
 * 診断APIをモックにするか
 * true: フォーム送信時にダミーレスポンスを返す（GAS不要）
 * false: 実際のAPIを呼ぶ
 */
export function getUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}
