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
 * - 未設定 or "true": モック（GAS不要で動作）
 * - "false": 実際のAPI（GAS_URL必須）
 * デフォルトはモックにし、Vercel 等で env 未設定でも動くようにする
 */
export function getUseMock(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK !== "false";
}

/**
 * Slack Incoming Webhook URL（サーバー専用）
 * 設定すると診断成功時に Slack へ通知
 */
export function getSlackWebhookUrl(): string {
  return process.env.SLACK_WEBHOOK_URL?.trim() ?? "";
}
