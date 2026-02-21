/**
 * バリデーション・マッピングのエントリ
 * テーマ集約のため、業務効率化テーマから re-export
 *
 * 【再利用時】
 * 別テーマを使う場合は、ここで import 元を themes/<テーマ名> に差し替え
 */
export {
  validateForm,
  apiResponseToResultData,
} from "@/themes/efficiency";
export type { ValidationErrors } from "@/themes/efficiency";
