/**
 * 相談API（GASへのプロキシ、action: "consult"）
 *
 * 【拡張ポイント】
 * - メール送信: GAS側でメール送信 or ここで別のメールAPIを呼ぶ
 * - 認証: 相談送信のレート制限・CAPTCHA 等
 */
import { NextRequest, NextResponse } from "next/server";
import { getGasUrl } from "@/lib/config";
import {
  logConsultError,
  logConsultSuccess,
  logGasHttpError,
} from "@/lib/logger";

export async function POST(request: NextRequest) {
  const gasUrl = getGasUrl();
  if (!gasUrl) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "サーバー設定エラー。GAS_URLが未設定です。.env.local を参照してください。",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    logConsultError("request_parse", err);
    return NextResponse.json(
      {
        status: "error",
        message: "リクエストデータの解析に失敗しました。",
      },
      { status: 400 }
    );
  }

  try {
    const payload = { ...(body as Record<string, unknown>), action: "consult" };
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();

    if (!res.ok) {
      logGasHttpError(res.status, "consult");
      return NextResponse.json(
        {
          status: "error",
          message: "送信に失敗しました。しばらくしてからお試しください。",
        },
        { status: 502 }
      );
    }

    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      logConsultError("gas_response", new Error("Response is not JSON"));
      return NextResponse.json(
        {
          status: "error",
          message: "送信に失敗しました。しばらくしてからお試しください。",
        },
        { status: 502 }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logConsultError("json_parse", new Error("Invalid JSON from GAS"));
      return NextResponse.json(
        {
          status: "error",
          message: "送信サーバーからの応答形式が正しくありません。",
        },
        { status: 502 }
      );
    }

    logConsultSuccess();
    return NextResponse.json(data);
  } catch (err) {
    logConsultError("fetch", err);
    return NextResponse.json(
      { status: "error", message: "送信に失敗しました。" },
      { status: 500 }
    );
  }
}
