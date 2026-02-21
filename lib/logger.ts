/**
 * ログ出力の共通化
 * - 個人情報（メール・会社名等）はログに出さない
 * - 成功/失敗・処理の区切りが分かる形式
 * - 開発時に追いやすいプレフィックス
 */

const PREFIX = "[診断ツール]";

type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, tag: string, message: string, detail?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const detailStr = detail && Object.keys(detail).length > 0 ? ` ${JSON.stringify(detail)}` : "";
  const line = `${PREFIX} [${timestamp}] [${tag}] ${message}${detailStr}`;

  switch (level) {
    case "info":
      console.info(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "error":
      console.error(line);
      break;
  }
}

/** 診断API: 開始 */
export function logDiagnosisStart() {
  log("info", "diagnosis", "診断API呼び出し開始");
}

/** 診断API: 成功 */
export function logDiagnosisSuccess() {
  log("info", "diagnosis", "診断API 成功");
}

/** 診断API: 失敗 */
export function logDiagnosisError(phase: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  log("error", "diagnosis", `診断API 失敗 phase=${phase}`, { error: msg });
}

/** 相談API: 開始 */
export function logConsultStart() {
  log("info", "consult", "相談API呼び出し開始");
}

/** 相談API: 成功 */
export function logConsultSuccess() {
  log("info", "consult", "相談API 成功");
}

/** 相談API: 失敗 */
export function logConsultError(phase: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  log("error", "consult", `相談API 失敗 phase=${phase}`, { error: msg });
}

/** GAS呼び出し: HTTPエラー */
export function logGasHttpError(status: number, path: string) {
  log("error", "gas", "GAS応答がHTTPエラー", { status, path });
}

/** ROI不整合の警告（個人情報なし） */
export function logRoiInconsistency(detail: { conservative: number; base: number; aggressive: number }) {
  log("warn", "roi", "ROI順序不整合のためフォールバック適用", detail);
}
