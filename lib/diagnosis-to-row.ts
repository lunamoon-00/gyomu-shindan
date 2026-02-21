/**
 * 診断フォーム + API レスポンス → Supabase diagnoses 行への変換
 * 文字数・数値範囲を制限して保存する
 */
import type { FormData, ApiResponse } from "@/themes/efficiency/types";
import type { DiagnosisRow } from "./supabase-server";

const MAX = {
  company_name: 500,
  contact_name: 200,
  hourly_cost: 50,
  budget_level: 50,
  task1_name: 300,
  trouble_text: 2000,
  bottleneck_task: 300,
  it_tools_count: 50,
} as const;

function slice(str: unknown, max: number): string {
  return String(str ?? "").slice(0, max);
}

function clampNum(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function formAndResponseToRow(
  form: FormData,
  api: ApiResponse,
  source: string = "web"
): Omit<DiagnosisRow, "id" | "created_at"> {
  const itTools = Array.isArray(form.it_tools) ? form.it_tools : [];
  return {
    company_name: slice(form.company_name, MAX.company_name),
    contact_name: slice(form.contact_name, MAX.contact_name),
    backoffice_people: clampNum(form.backoffice_people, 0, 100000),
    hourly_cost: slice(form.hourly_cost, MAX.hourly_cost),
    it_tools: itTools.slice(0, MAX.it_tools_count).map((t) => String(t).slice(0, 100)),
    it_literacy:
      typeof form.it_literacy === "number" &&
      form.it_literacy >= 1 &&
      form.it_literacy <= 5
        ? form.it_literacy
        : null,
    team_cooperation:
      typeof form.team_cooperation === "number" &&
      form.team_cooperation >= 1 &&
      form.team_cooperation <= 5
        ? form.team_cooperation
        : null,
    budget_level: slice(form.budget_level, MAX.budget_level),
    task1_name: slice(form.task1_name, MAX.task1_name),
    task1_freq: clampNum(form.task1_freq, 0, 10000),
    task1_time: clampNum(form.task1_time, 0, 10000),
    trouble_text: slice(form.trouble_text, MAX.trouble_text),
    bottleneck_task:
      typeof api.bottleneckTask === "string" && api.bottleneckTask.trim()
        ? api.bottleneckTask.slice(0, MAX.bottleneck_task)
        : null,
    monthly_saved_cost:
      typeof api.monthlySavedCost === "number" && api.monthlySavedCost >= 0
        ? api.monthlySavedCost
        : null,
    lead_rank: "A",
    source: slice(source, 50) || "web",
  };
}
