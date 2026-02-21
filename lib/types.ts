/**
 * フォームデータ型
 */
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

/**
 * APIレスポンス型（既存GAS互換）
 */
export interface ApiResponse {
  status: "success" | "error";
  slidesUrl?: string;
  bottleneckTask?: string;
  monthlySavedCost?: number;
  message?: string;
}

/**
 * 診断結果画面用の拡張型（ダミー or GAS将来対応）
 */
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
