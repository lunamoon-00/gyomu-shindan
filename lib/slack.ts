/**
 * Slack 通知（Incoming Webhook）
 * 診断成功時に Slack へメッセージを送信
 */
import type { FormData, ApiResponse } from "@/themes/efficiency/types";

function formatNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "-";
  return n.toLocaleString();
}

export async function notifySlackDiagnosis(
  form: FormData,
  api: ApiResponse,
  webhookUrl: string
): Promise<void> {
  if (!webhookUrl) return;
  const company = form.company_name || "-";
  const contact = form.contact_name || "-";
  console.log("[slack] Sending notification for:", company, contact);
  const bottleneck = api.bottleneckTask || "-";
  const saved = formatNum(api.monthlySavedCost);
  const text = `【新規診断】${company} / ${contact}\nボトルネック: ${bottleneck}\n月間削減効果: ${saved}円`;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*新規診断が届きました*\n• 会社名: ${company}\n• 担当者: ${contact}\n• ボトルネック業務: ${bottleneck}\n• 月間削減効果: ${saved}円`,
            },
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[slack] webhook failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[slack] notify error:", err);
  }
}
