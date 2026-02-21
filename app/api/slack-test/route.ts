/**
 * Slack Webhook の動作確認用（デバッグ）
 * ブラウザで /api/slack-test にアクセスするとテストメッセージを送信
 * 本番では削除 or 認証を追加してください
 */
import { NextResponse } from "next/server";
import { getSlackWebhookUrl } from "@/lib/config";

export async function GET() {
  const webhookUrl = getSlackWebhookUrl();
  if (!webhookUrl) {
    return NextResponse.json(
      { ok: false, message: "SLACK_WEBHOOK_URL が未設定です。.env.local を確認してください。" },
      { status: 200 }
    );
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "✅ Slack 接続テスト成功（業務効率化診断ツール）",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Slack 接続テスト*\nWebhook は正常に動作しています。",
            },
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        {
          ok: false,
          message: `Slack からエラー: ${res.status}`,
          detail: body.slice(0, 200),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Slack にテストメッセージを送信しました。チャンネルを確認してください。",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, message: "送信失敗", detail: msg },
      { status: 200 }
    );
  }
}
