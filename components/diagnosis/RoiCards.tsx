/**
 * ROI 3パターン表示
 * 慎重・標準・積極
 */
"use client";

import type { ResultData } from "@/lib/types";

interface RoiCardsProps {
  data: ResultData;
}

export function RoiCards({ data }: RoiCardsProps) {
  const items = [
    { key: "conservative" as const, label: "慎重", color: "border-lavender-300 bg-lavender-50" },
    { key: "base" as const, label: "標準", color: "border-navy-400 bg-navy-50" },
    { key: "aggressive" as const, label: "積極", color: "border-navy-600 bg-navy-100" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-navy-600">
        削減見込み（円/月）
      </p>
      <div className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={`p-4 rounded-xl border-2 ${item.color}`}
          >
            <p className="text-xs text-navy-600 mb-1">{item.label}</p>
            <p className="text-lg font-bold text-navy-800">
              {data.roi[item.key].toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
