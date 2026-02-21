/**
 * フォームカード
 * 角丸・余白広め・統一された見た目
 */
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface FormCardProps {
  children: ReactNode;
  /** カードのアイコン（Lucideアイコンなど） */
  icon?: ReactNode;
  /** 見出し */
  title: string;
  /** 説明文 */
  description?: string;
  /** アニメーション用 */
  initial?: { opacity?: number; y?: number };
  animate?: { opacity?: number; y?: number };
  ref?: (el: HTMLDivElement | null) => void;
}

export function FormCard({
  children,
  icon,
  title,
  description,
  initial = { opacity: 0, y: 24 },
  animate = { opacity: 1, y: 0 },
  ref,
}: FormCardProps) {
  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.4 }}
      className="bg-white/90 backdrop-blur rounded-2xl shadow-soft p-6 sm:p-8 border border-lavender-200/80"
    >
      <div className="flex items-start gap-4 mb-6">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-lavender-100 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h2 className="font-semibold text-navy-800 text-lg">{title}</h2>
          {description && (
            <p className="text-sm text-navy-500 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}
