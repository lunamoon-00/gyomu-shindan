/**
 * 業務効率化診断テーマ用のバリデーション・マッピング
 * - フォーム入力の検証
 * - APIレスポンス → 結果画面用データへの変換
 */
import type { FormData, ResultData } from "./types";
import { logRoiInconsistency } from "@/lib/logger";

export type ValidationErrors = Partial<Record<keyof FormData, string>>;

/** フォームのバリデーション（必須・数値・形式） */
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
  const freq = Number(formData.task1_freq);
  if (Number.isNaN(freq) || freq < 1) {
    errors.task1_freq = "1週間あたりの実施回数を入力してください（1以上）";
  }
  const time = Number(formData.task1_time);
  if (Number.isNaN(time) || time < 1) {
    errors.task1_time = "1回あたりの作業時間（分）を入力してください（1以上）";
  }
  const people = Number(formData.backoffice_people);
  if (Number.isNaN(people) || people < 1) {
    errors.backoffice_people = "担当人数は1以上で入力してください";
  }

  return errors;
}

const DEFAULT_BASE = 48000;

function safeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && !Number.isNaN(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (!Number.isNaN(n) && n >= 0) return Math.round(n);
  }
  return fallback;
}

function ensureRoiOrder(
  conservative: number,
  base: number,
  aggressive: number
): { conservative: number; base: number; aggressive: number } {
  const ok = conservative <= base && base <= aggressive;
  if (ok) return { conservative, base, aggressive };

  logRoiInconsistency({ conservative, base, aggressive });
  return {
    conservative: Math.round(base * 0.5),
    base,
    aggressive: Math.round(base * 1.5),
  };
}

/** APIレスポンス → 結果画面用ResultData へのマッピング */
export function apiResponseToResultData(api: {
  bottleneckTask?: string;
  monthlySavedCost?: number;
}): ResultData {
  const base = safeNumber(api.monthlySavedCost, DEFAULT_BASE);
  const conservative = Math.round(base * 0.5);
  const aggressive = Math.round(base * 1.5);
  const roi = ensureRoiOrder(conservative, base, aggressive);

  return {
    leadRank: "A",
    bottleneckTop:
      typeof api.bottleneckTask === "string" && api.bottleneckTask.trim()
        ? api.bottleneckTask.trim()
        : "分析対象の業務",
    totalWeeklyHours: 18.5,
    monthlyLaborCost: 120000,
    difficultyScore: 2.8,
    roi,
    roadmap: {
      phase1: "現状整理（0〜2週）：最優先業務の手順を可視化",
      phase2: "小さく導入（2〜6週）：試験的にツール導入",
      phase3: "横展開（1〜3か月）：効果検証後、関連業務へ展開",
    },
  };
}
