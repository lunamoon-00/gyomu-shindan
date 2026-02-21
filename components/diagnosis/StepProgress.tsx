/**
 * ステップ進捗バー
 * Step X / Total を表示し、進捗をビジュアル化
 */
"use client";

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  /** 表示用のラベル（例: "Step 1 / 4"） */
  label?: string;
}

export function StepProgress({
  currentStep,
  totalSteps,
  label,
}: StepProgressProps) {
  const progress = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-navy-600 mb-2">
        <span>
          {label ?? `Step ${currentStep + 1} / ${totalSteps}`}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 bg-lavender-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-navy-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
