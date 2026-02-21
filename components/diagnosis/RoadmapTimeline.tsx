/**
 * 段階的導入ロードマップ
 * Phase1〜3
 */
"use client";

import { MapPin } from "lucide-react";
import type { ResultData } from "@/lib/types";

interface RoadmapTimelineProps {
  data: ResultData;
}

export function RoadmapTimeline({ data }: RoadmapTimelineProps) {
  const phases = [
    { title: "Phase 1", period: "0〜2週", text: data.roadmap.phase1 },
    { title: "Phase 2", period: "2〜6週", text: data.roadmap.phase2 },
    { title: "Phase 3", period: "1〜3か月", text: data.roadmap.phase3 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-navy-600" />
        <span className="font-medium text-navy-800">段階的導入ロードマップ</span>
      </div>
      <div className="space-y-3">
        {phases.map((phase, i) => (
          <div
            key={phase.title}
            className="flex gap-4 p-4 rounded-xl bg-white border border-lavender-200/80"
          >
            <div className="shrink-0 w-16 text-sm font-medium text-navy-600">
              {phase.title}
            </div>
            <div className="shrink-0 text-xs text-navy-500">{phase.period}</div>
            <p className="text-navy-700">{phase.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
