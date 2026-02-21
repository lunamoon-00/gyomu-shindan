/**
 * 診断結果のDB保存API（モック時用）
 * フロントから診断成功後に呼ばれる。Supabase が設定されていれば diagnoses に 1 件 insert
 * 本番（GAS）時は /api/diagnosis 内で保存するため、この API はモック時のみ呼ばれる想定
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase-server";
import { formAndResponseToRow } from "@/lib/diagnosis-to-row";
import type { FormData, ApiResponse } from "@/themes/efficiency/types";

export async function POST(request: NextRequest) {
  if (!getSupabase()) {
    return NextResponse.json({ status: "ok", saved: false }, { status: 200 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const { formData, apiResponse, source } = body as {
    formData?: unknown;
    apiResponse?: unknown;
    source?: string;
  };

  if (
    !formData ||
    typeof formData !== "object" ||
    !apiResponse ||
    typeof apiResponse !== "object" ||
    (apiResponse as ApiResponse).status !== "success"
  ) {
    return NextResponse.json(
      { status: "error", message: "Invalid payload" },
      { status: 400 }
    );
  }

  const form = formData as FormData;
  if (!("company_name" in form) || !("task1_name" in form)) {
    return NextResponse.json(
      { status: "error", message: "Missing required form fields" },
      { status: 400 }
    );
  }

  try {
    const row = formAndResponseToRow(form, apiResponse as ApiResponse, source ?? "mock");
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ status: "ok", saved: false }, { status: 200 });
    }
    const { error } = await supabase.from("diagnoses").insert(row);
    if (error) {
      console.error("[diagnosis/save] insert failed:", error.message);
      return NextResponse.json({ status: "ok", saved: false }, { status: 200 });
    }
    return NextResponse.json({ status: "ok", saved: true }, { status: 200 });
  } catch (err) {
    console.error("[diagnosis/save] error:", err);
    return NextResponse.json({ status: "ok", saved: false }, { status: 200 });
  }
}
