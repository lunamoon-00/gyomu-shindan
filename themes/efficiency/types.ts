/**
 * 業務効率化診断テーマ用の型定義
 *
 * 【再利用のポイント】
 * 別テーマ（SNS運用診断など）では、FormData / ApiResponse / ResultData
 * を別の形で定義し、同じ名前で export すれば差し替え可能。
 */

/** フォーム入力データ */
export interface FormData {
  company_name: string;
  contact_name: string;
  backoffice_people: number;
  hourly_cost: string;
  it_tools: string[];
  it_literacy: number;
  team_cooperation: number;
  budget_level: string;
  task1_name: string;
  task1_freq: number;
  task1_time: number;
  trouble_text: string;
}

/** APIレスポンス（GAS互換） */
export interface ApiResponse {
  status: "success" | "error";
  slidesUrl?: string;
  bottleneckTask?: string;
  monthlySavedCost?: number;
  message?: string;
}

/** 診断結果画面用の表示データ */
export interface ResultData {
  leadRank: "S" | "A" | "B";
  bottleneckTop: string;
  totalWeeklyHours: number;
  monthlyLaborCost: number;
  difficultyScore: number;
  roi: {
    conservative: number;
    base: number;
    aggressive: number;
  };
  roadmap: {
    phase1: string;
    phase2: string;
    phase3: string;
  };
}
