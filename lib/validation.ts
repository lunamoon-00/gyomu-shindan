import type { FormData } from "./types";

/**
 * バリデーションエラー型
 */
export type ValidationErrors = Partial<Record<keyof FormData, string>>;

/**
 * フォームのバリデーション
 * 必須項目・数値・形式チェック
 */
export function validateForm(formData: FormData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!formData.company_name?.trim()) {
    errors.company_name = "会社名を入力してください";
  }

  if (!formData.contact_name?.trim()) {
    errors.contact_name = "担当者名を入力してください";
  }

  if (!formData.hourly_cost) {
    errors.hourly_cost = "想定人件費を選択してください";
  }

  if (!formData.budget_level) {
    errors.budget_level = "導入予算感を選択してください";
  }

  if (!formData.task1_name?.trim()) {
    errors.task1_name = "業務名を入力してください";
  }

  if (!formData.task1_freq || formData.task1_freq < 1) {
    errors.task1_freq = "1週間あたりの実施回数を入力してください（1以上）";
  }

  if (!formData.task1_time || formData.task1_time < 1) {
    errors.task1_time = "1回あたりの作業時間（分）を入力してください（1以上）";
  }

  if (formData.backoffice_people < 1) {
    errors.backoffice_people = "担当人数は1以上で入力してください";
  }

  return errors;
}

import type { ResultData } from "./types";

/**
 * APIレスポンスからResultDataを生成
 */
export function apiResponseToResultData(api: {
  bottleneckTask?: string;
  monthlySavedCost?: number;
}): ResultData {
  return {
    leadRank: "A",
    bottleneckTop: api.bottleneckTask || "分析対象の業務",
    totalWeeklyHours: 18.5,
    monthlyLaborCost: 120000,
    difficultyScore: 2.8,
    roi: {
      conservative: 24000,
      base: api.monthlySavedCost ?? 48000,
      aggressive: 72000,
    },
    roadmap: {
      phase1: "現状整理（0〜2週）：最優先業務の手順を可視化",
      phase2: "小さく導入（2〜6週）：試験的にツール導入",
      phase3: "横展開（1〜3か月）：効果検証後、関連業務へ展開",
    },
  };
}
