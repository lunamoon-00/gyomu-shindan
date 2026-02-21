/**
 * 業務効率化診断テーマ用の定数
 * フォームの選択肢など、このテーマ固有の値
 */

export const HOURLY_COST_OPTIONS = [
  { value: "1200", label: "1,200円" },
  { value: "1500", label: "1,500円" },
  { value: "2000", label: "2,000円" },
  { value: "2500", label: "2,500円" },
  { value: "3000", label: "3,000円以上" },
];

export const IT_TOOLS_OPTIONS = [
  "Excel / Googleスプレッドシート",
  "勤怠管理システム",
  "経費精算システム",
  "請求書作成ツール",
  "Slack / Teams",
  "業務管理ツール",
  "その他 / 特になし",
];

export const BUDGET_OPTIONS = [
  { value: "low", label: "低（〜5万円/月）" },
  { value: "medium", label: "中（5万〜15万円/月）" },
  { value: "high", label: "高（15万円以上/月）" },
];

export const IT_LITERACY_LABELS = [
  "ほとんど使えない",
  "少し使える",
  "普通",
  "比較的得意",
  "かなり得意",
];
