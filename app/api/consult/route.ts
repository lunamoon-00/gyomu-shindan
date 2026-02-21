import { NextRequest, NextResponse } from "next/server";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxbNcKyak_Pq5VxTJfJo0A_dn60AdaG6c5mlPYxhbFr83HA2PIrsVluYhtn5xFdHM89yg/exec";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, action: "consult" }),
    });
    const text = await res.text();
    if (!text.trim().startsWith("{") && !text.trim().startsWith("[")) {
      return NextResponse.json(
        {
          status: "error",
          message: "送信に失敗しました。しばらくしてからお試しください。",
        },
        { status: 502 }
      );
    }
    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Consult API error:", err);
    return NextResponse.json(
      { status: "error", message: "送信に失敗しました。" },
      { status: 500 }
    );
  }
}
