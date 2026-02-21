"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Users,
  DollarSign,
  Laptop,
  Brain,
  Handshake,
  Wallet,
  ClipboardList,
  FileText,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { FormData, ApiResponse } from "@/lib/types";
import {
  THEME_META,
  INITIAL_FORM_DATA,
  HOURLY_COST_OPTIONS,
  IT_TOOLS_OPTIONS,
  BUDGET_OPTIONS,
  validateForm,
  apiResponseToResultData,
} from "@/themes/efficiency";
import { submitDiagnosis } from "@/lib/submitDiagnosis";
import { getConsultEmail } from "@/lib/config";
import { StepProgress } from "@/components/diagnosis/StepProgress";
import { ResultScreen } from "@/components/diagnosis/ResultScreen";

/** ステップ数・初期値はテーマから取得（再利用時は差し替え） */
const { totalSteps: TOTAL_STEPS } = THEME_META;
const initialFormData = INITIAL_FORM_DATA;

export default function DiagnosisPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [consultSent, setConsultSent] = useState(false);
  const [consultSending, setConsultSending] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const updateForm = useCallback(<K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleItTool = (tool: string) => {
    setFormData((prev) => ({
      ...prev,
      it_tools: prev.it_tools.includes(tool)
        ? prev.it_tools.filter((t) => t !== tool)
        : [...prev.it_tools, tool],
    }));
  };

  const handleSubmit = async () => {
    // 二重送信防止
    if (isLoading) return;

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstKey = Object.keys(errors)[0];
      const el = document.querySelector(`[data-field="${firstKey}"]`);
      el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setValidationErrors({});
    setIsLoading(true);
    setResult(null);
    setConsultSent(false);
    setConsultError(null);

    try {
      const data = await submitDiagnosis(formData);
      setResult(data);
      // モック時のみDB保存（本番API時は /api/diagnosis 内で保存済み）
      if (data.status === "success" && process.env.NEXT_PUBLIC_USE_MOCK !== "false") {
        void fetch("/api/diagnosis/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            formData,
            apiResponse: data,
            source: "mock",
          }),
        });
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "通信エラーが発生しました。もう一度お試しください。";
      setResult({ status: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsult = async (email: string) => {
    const consultEmail = getConsultEmail();
    if (!consultEmail) {
      setConsultError("相談機能の設定が完了していません。");
      return;
    }
    if (consultSending) return; // 二重送信防止

    setConsultSending(true);
    setConsultError(null);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultEmail,
          replyEmail: email,
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          bottleneckTask: result?.status === "success" ? result.bottleneckTask : undefined,
          monthlySavedCost: result?.status === "success" ? result.monthlySavedCost : undefined,
        }),
      });

      let data: { status?: string; message?: string };
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        setConsultError("送信サーバーからの応答形式が正しくありません。");
        return;
      }

      if (!res.ok) {
        setConsultError(data.message || "送信に失敗しました。しばらくしてからお試しください。");
        return;
      }
      if (data.status === "success") {
        setConsultSent(true);
      } else {
        setConsultError(data.message || "送信に失敗しました。");
      }
    } catch {
      setConsultError("送信に失敗しました。ネットワークを確認してもう一度お試しください。");
    } finally {
      setConsultSending(false);
    }
  };

  // スクロールで次のセクションへ
  const scrollToNext = () => {
    const next = sectionRefs.current[currentStep + 1];
    if (next) {
      next.scrollIntoView({ behavior: "smooth" });
      setCurrentStep((s) => Math.min(s + 1, 10));
    }
  };

  const isSubmitEnabled =
    formData.company_name &&
    formData.contact_name &&
    formData.hourly_cost &&
    formData.budget_level &&
    formData.task1_name &&
    formData.task1_freq > 0 &&
    formData.task1_time > 0;

  return (
    <div className="min-h-screen pb-24">
      {/* ヘッダー */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/90 border-b border-lavender-200/80">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-navy-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-lavender-500" />
            {THEME_META.title}
          </h1>
          <p className="text-sm text-navy-500 mt-0.5">
            {THEME_META.description}
          </p>
          <div className="mt-4">
            <StepProgress
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              label={`Step ${currentStep + 1} / ${TOTAL_STEPS}`}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8 space-y-16">
        {/* Step 1: 会社名・担当者名 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[0] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">基本情報</h2>
              <p className="text-sm text-slate-500">会社名・担当者名</p>
            </div>
          </div>
          <div className="space-y-4">
            <div data-field="company_name">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => updateForm("company_name", e.target.value)}
                placeholder="例：株式会社○○"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                  validationErrors.company_name
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                }`}
              />
              {validationErrors.company_name && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.company_name}</p>
              )}
            </div>
            <div data-field="contact_name">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                担当者名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => updateForm("contact_name", e.target.value)}
                placeholder="例：山田 太郎"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                  validationErrors.contact_name
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                }`}
              />
              {validationErrors.contact_name && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.contact_name}</p>
              )}
            </div>
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 2: 事務・バックオフィス担当人数 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[1] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">チーム規模</h2>
              <p className="text-sm text-slate-500">事務・バックオフィス担当人数</p>
            </div>
          </div>
          <div data-field="backoffice_people">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              担当人数 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={formData.backoffice_people || ""}
              onChange={(e) =>
                updateForm("backoffice_people", parseInt(e.target.value) || 1)
              }
              placeholder="例：5"
              className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                validationErrors.backoffice_people
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              }`}
            />
            {validationErrors.backoffice_people && (
              <p className="mt-1 text-sm text-red-500">{validationErrors.backoffice_people}</p>
            )}
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 3: 想定人件費 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[2] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">想定人件費</h2>
              <p className="text-sm text-slate-500">時給換算</p>
            </div>
          </div>
          <div data-field="hourly_cost">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              想定人件費（時給換算） <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HOURLY_COST_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm("hourly_cost", opt.value)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    formData.hourly_cost === opt.value
                      ? "bg-navy-600 text-white shadow-lg shadow-navy-500/30"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {validationErrors.hourly_cost && (
              <p className="mt-2 text-sm text-red-500">{validationErrors.hourly_cost}</p>
            )}
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 4: ITツール利用状況 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[3] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">ITツールの利用状況</h2>
              <p className="text-sm text-slate-500">当てはまるものをすべて選択</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {IT_TOOLS_OPTIONS.map((tool) => (
              <button
                key={tool}
                onClick={() => toggleItTool(tool)}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  formData.it_tools.includes(tool)
                    ? "bg-emerald-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 5: ITリテラシー */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[4] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">ITリテラシー</h2>
              <p className="text-sm text-slate-500">
                PCや業務ツールをどのくらい使いこなせるか
              </p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => updateForm("it_literacy", n)}
                className={`flex-1 min-w-[4rem] py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] ${
                  formData.it_literacy === n
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">1＝ほとんど使えない ～ 5＝かなり得意</p>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 6: 現場の協力見込み */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[5] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Handshake className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">現場の協力見込み</h2>
              <p className="text-sm text-slate-500">
                業務改善やIT導入を進める際、現場からどれくらい協力が得られそうか
              </p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => updateForm("team_cooperation", n)}
                className={`flex-1 min-w-[4rem] py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] ${
                  formData.team_cooperation === n
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">1＝かなり低い ～ 5＝かなり高い</p>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 7: 導入予算感 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[6] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">導入予算感</h2>
              <p className="text-sm text-slate-500">月額目安</p>
            </div>
          </div>
          <div data-field="budget_level">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              導入予算感 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateForm("budget_level", opt.value)}
                  className={`w-full py-3.5 px-4 rounded-xl text-left font-medium transition-all hover:scale-[1.01] ${
                    formData.budget_level === opt.value
                      ? "bg-navy-600 text-white shadow-lg shadow-navy-500/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {validationErrors.budget_level && (
              <p className="mt-2 text-sm text-red-500">{validationErrors.budget_level}</p>
            )}
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 8: 最も困っている業務 */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[7] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">最も困っている業務</h2>
              <p className="text-sm text-slate-500">業務名・実施頻度・作業時間</p>
            </div>
          </div>
          <div className="space-y-4">
            <div data-field="task1_name">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                業務の名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.task1_name}
                onChange={(e) => updateForm("task1_name", e.target.value)}
                placeholder="例：月次請求書作成"
                className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                  validationErrors.task1_name
                    ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                }`}
              />
              {validationErrors.task1_name && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.task1_name}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div data-field="task1_freq">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  1週間あたりの実施回数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.task1_freq || ""}
                  onChange={(e) =>
                    updateForm("task1_freq", parseInt(e.target.value) || 0)
                  }
                  placeholder="例：4"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                    validationErrors.task1_freq
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  }`}
                />
                {validationErrors.task1_freq && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.task1_freq}</p>
                )}
              </div>
              <div data-field="task1_time">
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  1回あたりの作業時間（分） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.task1_time || ""}
                  onChange={(e) =>
                    updateForm("task1_time", parseInt(e.target.value) || 0)
                  }
                  placeholder="例：60"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition ${
                    validationErrors.task1_time
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
                  }`}
                />
                {validationErrors.task1_time && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.task1_time}</p>
                )}
              </div>
            </div>
          </div>
          <NextButton onClick={scrollToNext} label="次へ" />
        </motion.div>

        {/* Step 9: 現在特に困っていること */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[8] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-soft p-6 border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">
                現在特に困っていること
              </h2>
              <p className="text-sm text-slate-500">自由記述（任意）</p>
            </div>
          </div>
          <textarea
            value={formData.trouble_text}
            onChange={(e) => updateForm("trouble_text", e.target.value)}
            placeholder="例：手作業が多い、属人化している、ミスが発生しやすい など"
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition resize-none"
          />
        </motion.div>

        {/* 診断ボタン */}
        <motion.div
          ref={(el) => {
            sectionRefs.current[9] = el;
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center pt-4"
        >
          <button
            onClick={handleSubmit}
            disabled={!isSubmitEnabled || isLoading}
            className="relative overflow-hidden group w-full max-w-md py-5 px-8 rounded-2xl bg-gradient-to-r from-navy-600 to-navy-700 text-white font-bold text-lg shadow-soft-lg shadow-navy-500/30 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            <span className="absolute inset-0 shimmer rounded-2xl opacity-40 pointer-events-none" />
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                AIが業務データを分析中...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                無料で診断結果を見る
              </>
            )}
          </button>
          {!isSubmitEnabled && (
            <p className="mt-3 text-sm text-slate-500 text-center">
              上記の必須項目（会社名・担当者名・想定人件費・導入予算感・困っている業務と実施回数・作業時間）を入力するとボタンが有効になります
            </p>
          )}
        </motion.div>
      </main>

      {/* 結果モーダル */}
      <AnimatePresence>
        {result && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
          >
            <div
              className="min-h-full bg-navy-900/50 backdrop-blur-sm flex items-start justify-center p-4"
              onClick={() => setResult(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl my-8"
              >
                {result.status === "success" ? (
                  <div className="bg-lavender-50/95 rounded-2xl shadow-soft-lg p-6 border border-lavender-200">
                    <ResultScreen
                      data={apiResponseToResultData(result)}
                      formCompany={formData.company_name}
                      formContact={formData.contact_name}
                      onConsult={handleConsult}
                      consultSending={consultSending}
                      consultSent={consultSent}
                      consultError={consultError}
                      onClose={() => setResult(null)}
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-lavender-200 text-center">
                    <p className="text-red-600 mb-4">
                      {result.message || "エラーが発生しました"}
                    </p>
                    <p className="text-sm text-navy-500 mb-6">
                      お手数ですが、もう一度お試しください。
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => setResult(null)}
                        className="py-2 px-6 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50"
                      >
                        閉じる
                      </button>
                      <button
                        onClick={handleSubmit}
                        className="py-2 px-6 rounded-xl bg-navy-600 text-white hover:bg-navy-700"
                      >
                        もう一度送信する
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NextButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="mt-6 w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-medium flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
    >
      {label}
      <ChevronRight className="w-5 h-5" />
    </motion.button>
  );
}
