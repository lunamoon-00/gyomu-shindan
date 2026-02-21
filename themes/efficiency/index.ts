/**
 * 業務効率化診断テーマのエントリ
 *
 * 【設計意図】
 * - テーマに必要なものをここで集約し、1箇所から import できるようにする
 * - 別テーマ追加時は themes/sns/index.ts などを同様に作成
 * - 将来: DIAGNOSIS_THEME 環境変数で読み込むテーマを切り替え可能にする
 */

import type { FormData, ApiResponse, ResultData } from "./types";
import { validateForm, apiResponseToResultData } from "./validation";
import type { ValidationErrors } from "./validation";

export * from "./types";
export * from "./constants";
export { validateForm, apiResponseToResultData } from "./validation";
export type { ValidationErrors } from "./validation";

/** テーマのメタ情報（ページタイトル・ステップ数など） */
export const THEME_META = {
  id: "efficiency",
  title: "業務効率化診断",
  description: "約3分で、業務改善ポイントを分析します",
  totalSteps: 9,
} as const;

/** フォームの初期値 */
export const INITIAL_FORM_DATA: FormData = {
  company_name: "",
  contact_name: "",
  backoffice_people: 1,
  hourly_cost: "",
  it_tools: [],
  it_literacy: 0,
  team_cooperation: 0,
  budget_level: "",
  task1_name: "",
  task1_freq: 0,
  task1_time: 0,
  trouble_text: "",
};
