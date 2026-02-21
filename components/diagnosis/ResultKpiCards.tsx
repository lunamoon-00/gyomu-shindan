/**
 * 診断結果のKPIカード
 * 総工数・月間人件費・導入難易度
 */
"use client";

import { Clock, DollarSign, BarChart3 } from "lucide-react";
import type { ResultData } from "@/lib/types";

interface ResultKpiCardsProps {
  data: ResultData;
}

export function ResultKpiCards({ data }: ResultKpiCardsProps) {
  const cards = [
    {
      icon: Clock,
      label: "総工数（週）",
      value: `${data.totalWeeklyHours} 時間`,
      color: "bg-lavender-100 text-navy-700",
    },
    {
      icon: DollarSign,
      label: "月間人件費目安",
      value: `${data.monthlyLaborCost.toLocaleString()} 円`,
      color: "bg-lavender-100 text-navy-700",
    },
    {
      icon: BarChart3,
      label: "導入難易度",
      value: `${data.difficultyScore} / 5`,
      sub: "1=易 5=難",
      color: "bg-lavender-100 text-navy-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="p-4 rounded-xl bg-white border border-lavender-200/80 shadow-soft"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
            <card.icon className="w-5 h-5" />
          </div>
          <p className="text-xs text-navy-500 mb-1">{card.label}</p>
          <p className="text-lg font-bold text-navy-800">{card.value}</p>
          {card.sub && (
            <p className="text-xs text-navy-400 mt-0.5">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
