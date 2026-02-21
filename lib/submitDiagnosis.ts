import type { FormData } from "./types";
import type { ApiResponse } from "./types";

const API_ENDPOINT = "/api/diagnosis";

/**
 * 【GAS接続ポイント】
 * 診断データを送信する関数。
 * USE_MOCK を true にするとダミーレスポンスを返します。
 * 本番時は false にし、実際のAPIを呼び出してください。
 */
const USE_MOCK = false;

/**
 * 診断フォームの送信
 * @returns APIレスポンス（成功時は status: 'success'、失敗時は status: 'error'）
 */
export async function submitDiagnosis(formData: FormData): Promise<ApiResponse> {
  if (USE_MOCK) {
    return mockSubmit(formData);
  }
  return realSubmit(formData);
}

/**
 * モック送信（UI確認・開発用）
 * 1.5秒待機後にダミー成功レスポンスを返す
 */
async function mockSubmit(formData: FormData): Promise<ApiResponse> {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    status: "success",
    bottleneckTask: formData.task1_name || "問い合わせ対応",
    monthlySavedCost: 48000,
  };
}

/**
 * 実API送信（GAS経由）
 */
async function realSubmit(formData: FormData): Promise<ApiResponse> {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });
  const data: ApiResponse = await res.json();
  return data;
}
