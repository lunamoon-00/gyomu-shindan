import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxbNcKyak_Pq5VxTJfJo0A_dn60AdaG6c5mlPYxhbFr83HA2PIrsVluYhtn5xFdHM89yg/exec";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    // GASがHTML（エラーページ）を返した場合はJSONとして解析できない
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      return NextResponse.json(
        {
          status: "error",
          message:
            "診断サーバーからの応答が正しくありません。GASにdoPost関数が実装されているか、再デプロイしてください。",
        },
        { status: 502 }
      );
    }
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Diagnosis API error:", err);
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
