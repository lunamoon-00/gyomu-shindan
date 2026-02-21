/**
 * 診断API（GASへのプロキシ）
 *
 * 【拡張ポイント】
 * - GAS API: getGasUrl() でエンドポイント切り替え
 * - 認証: リクエストヘッダー検証を追加
 * - DB保存: ここで受け取った body をDBに書き込み
 * - PDF/スライド: GAS側で生成し、レスポンスの slidesUrl で返却
 */
import { NextRequest, NextResponse } from "next/server";
import { getGasUrl } from "@/lib/config";
import {
  logDiagnosisError,
  logDiagnosisSuccess,
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
    logDiagnosisError("request_parse", err);
    return NextResponse.json(
      {
        status: "error",
        message: "リクエストデータの解析に失敗しました。",
      },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(gasUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();

    // HTTPエラー時（4xx/5xx）
    if (!res.ok) {
      logGasHttpError(res.status, "diagnosis");
      return NextResponse.json(
        {
          status: "error",
          message:
            "診断サーバーに接続できませんでした。しばらくしてからお試しください。",
        },
        { status: 502 }
      );
    }

    // GASがHTML（エラーページ）を返した場合はJSONとして解析できない
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      logDiagnosisError("gas_response", new Error("Response is not JSON"));
      return NextResponse.json(
        {
          status: "error",
          message:
            "診断サーバーからの応答が正しくありません。GASにdoPost関数が実装されているか、再デプロイしてください。",
        },
        { status: 502 }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      logDiagnosisError("json_parse", new Error("Invalid JSON from GAS"));
      return NextResponse.json(
        {
          status: "error",
          message: "診断サーバーからの応答形式が正しくありません。",
        },
        { status: 502 }
      );
    }

    logDiagnosisSuccess();
    return NextResponse.json(data);
  } catch (err) {
    logDiagnosisError("fetch", err);
    return NextResponse.json(
      {
        status: "error",
        message:
          err instanceof Error ? err.message : "通信エラーが発生しました。",
      },
      { status: 500 }
    );
  }
}
