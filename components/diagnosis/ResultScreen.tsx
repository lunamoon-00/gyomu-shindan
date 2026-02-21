/**
 * 診断結果画面（サイト風ダッシュボード）
 * KPI・優先度・ボトルネック・ROI・ロードマップ・相談
 */
"use client";

import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";
import type { ResultData } from "@/lib/types";
import { ResultKpiCards } from "./ResultKpiCards";
import { RoiCards } from "./RoiCards";
import { RoadmapTimeline } from "./RoadmapTimeline";
import { ConsultationForm } from "./ConsultationForm";

interface ResultScreenProps {
  data: ResultData;
  formCompany: string;
  formContact: string;
  onConsult: (email: string) => Promise<void>;
  consultSending: boolean;
  consultSent: boolean;
  consultError: string | null;
  onClose: () => void;
}

const RANK_COLORS: Record<string, string> = {
  S: "bg-emerald-500 text-white",
  A: "bg-navy-600 text-white",
  B: "bg-navy-400 text-white",
};

export function ResultScreen({
  data,
  formCompany,
  formContact,
  onConsult,
  consultSending,
  consultSent,
  consultError,
  onClose,
}: ResultScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto space-y-6 pb-16"
    >
      {/* ヘッダー */}
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-lavender-100 flex items-center justify-center mb-4">
          <TrendingDown className="w-8 h-8 text-navy-600" />
        </div>
        <h2 className="text-xl font-bold text-navy-800">診断結果</h2>
        <p className="text-sm text-navy-500 mt-1">
          {formCompany} {formContact} 様
        </p>
      </div>

      {/* 優先度バッジ */}
      <div className="flex justify-center">
        <span
          className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-bold ${RANK_COLORS[data.leadRank] ?? RANK_COLORS.A}`}
        >
          優先度 {data.leadRank}
        </span>
      </div>

      {/* ボトルネック */}
      <div className="p-5 rounded-2xl bg-white border border-lavender-200 shadow-soft">
        <p className="text-sm font-medium text-navy-600 mb-2">
          改善が必要な業務
        </p>
        <p className="text-lg font-bold text-navy-800">{data.bottleneckTop}</p>
      </div>

      {/* KPIカード */}
      <ResultKpiCards data={data} />

      {/* ROI */}
      <div className="p-5 rounded-2xl bg-white border border-lavender-200 shadow-soft">
        <RoiCards data={data} />
      </div>

      {/* ロードマップ */}
      <div className="p-5 rounded-2xl bg-white border border-lavender-200 shadow-soft">
        <RoadmapTimeline data={data} />
      </div>

      {/* 相談フォーム */}
      <div className="p-5 rounded-2xl bg-white border border-lavender-200 shadow-soft">
        <h3 className="font-medium text-navy-800 mb-4">診断内容について相談する</h3>
        <ConsultationForm
          onSubmit={onConsult}
          isSending={consultSending}
          isSent={consultSent}
          error={consultError}
        />
      </div>

      <button
        onClick={onClose}
        className="w-full py-3 text-navy-500 hover:text-navy-700 text-sm"
      >
        閉じる
      </button>
    </motion.div>
  );
}
