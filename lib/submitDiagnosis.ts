import type { FormData } from "./types";
import type { ApiResponse } from "./types";
import { getUseMock } from "./config";

const API_ENDPOINT = "/api/diagnosis";

/**
 * 診断データを送信する関数
 * NEXT_PUBLIC_USE_MOCK=true でモック、本番は false。
 *
 * 【拡張ポイント】
 * - GAS API: realSubmit 内の fetch 先を環境変数で切り替え可能
 * - 認証: ヘッダーに Authorization 等を追加
 * - DB保存: API側で受け取り後の処理として実装
 */
export async function submitDiagnosis(formData: FormData): Promise<ApiResponse> {
  if (getUseMock()) {
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
 * 想定外レスポンスかチェック
 * status が success/error でない、または型が崩れている場合は error を返す
 */
function normalizeApiResponse(data: unknown): ApiResponse {
  if (data && typeof data === "object" && "status" in data) {
    const s = (data as { status: string }).status;
    if (s === "success" || s === "error") {
      return data as ApiResponse;
    }
  }
  return {
    status: "error",
    message: "診断サーバーからの応答形式が正しくありません。",
  };
}

/**
 * 実API送信（GAS経由）
 * - res.ok 未満はエラーとして扱う
 * - JSON解析失敗時もエラー
 */
async function realSubmit(formData: FormData): Promise<ApiResponse> {
  const res = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  });

  let text: string;
  try {
    text = await res.text();
  } catch (err) {
    throw new Error("応答の取得に失敗しました。");
  }

  if (!res.ok) {
    throw new Error(
      res.status >= 500
        ? "サーバーエラーが発生しました。しばらくしてからお試しください。"
        : "通信エラーが発生しました。もう一度お試しください。"
    );
  }

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("応答の解析に失敗しました。");
  }

  return normalizeApiResponse(data);
}
