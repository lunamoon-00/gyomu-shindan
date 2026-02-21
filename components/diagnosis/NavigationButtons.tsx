/**
 * 次へ / 戻る ボタン
 * 視認性の高いデザイン
 */
"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationButtonsProps {
  onNext: () => void;
  onPrev?: () => void;
  /** 戻るボタンを表示するか */
  showPrev?: boolean;
  /** 次へボタンのラベル */
  nextLabel?: string;
  /** 次へボタンを無効化（例: 必須未入力時） */
  nextDisabled?: boolean;
}

export function NavigationButtons({
  onNext,
  onPrev,
  showPrev = false,
  nextLabel = "次へ",
  nextDisabled = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex gap-3 mt-8">
      {showPrev && onPrev && (
        <motion.button
          type="button"
          onClick={onPrev}
          whileHover={{ scale: 1.02, x: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 py-3.5 px-4 rounded-xl border-2 border-navy-200 text-navy-700 font-medium flex items-center justify-center gap-2 hover:bg-navy-50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          戻る
        </motion.button>
      )}
      <motion.button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        whileHover={!nextDisabled ? { scale: 1.02, y: -2 } : {}}
        whileTap={!nextDisabled ? { scale: 0.98 } : {}}
        className={`flex-1 py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
          nextDisabled
            ? "bg-navy-100 text-navy-400 cursor-not-allowed"
            : "bg-navy-600 text-white hover:bg-navy-700 shadow-soft"
        }`}
      >
        {nextLabel}
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
