"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  TrendingDown,
  Mail,
} from "lucide-react";

// APIルート経由でGASを呼ぶ（CORS回避）
const API_ENDPOINT = "/api/diagnosis";

// 相談メールの送信先（ご自身のメールアドレスに変更してください）
const CONSULT_EMAIL = "b8szsuut4n@yahoo.co.jp";

// 型定義
interface FormData {
  company_name: string;
  contact_name: string;
  backoffice_people: number;
  hourly_cost: string;
  it_tools: string[];
  it_literacy: number;
  team_cooperation: number;
  budget_level: string;
  task1_name: string;
  task1_freq: number;
  task1_time: number;
  trouble_text: string;
}

interface ApiResponse {
  status: "success" | "error";
  slidesUrl?: string;
  bottleneckTask?: string;
  monthlySavedCost?: number;
  message?: string;
}

// オプション定数
const HOURLY_COST_OPTIONS = [
  { value: "1200", label: "1,200円" },
  { value: "1500", label: "1,500円" },
  { value: "2000", label: "2,000円" },
  { value: "2500", label: "2,500円" },
  { value: "3000", label: "3,000円以上" },
];

const IT_TOOLS_OPTIONS = [
  "Excel / Googleスプレッドシート",
  "勤怠管理システム",
  "経費精算システム",
  "請求書作成ツール",
  "Slack / Teams",
  "業務管理ツール",
  "その他 / 特になし",
];

const BUDGET_OPTIONS = [
  { value: "low", label: "低（〜5万円/月）" },
  { value: "medium", label: "中（5万〜15万円/月）" },
  { value: "high", label: "高（15万円以上/月）" },
];

const RATING_LABELS = [
  "ほとんど使えない",
  "少し使える",
  "普通",
  "比較的得意",
  "かなり得意",
];

const initialFormData: FormData = {
  company_name: "",
  contact_name: "",
  backoffice_people: 1,
  hourly_cost: "",
  it_tools: [],
  it_literacy: 0,
  team_cooperation: 0,
  budget_level: "",
  task1_name: "",
  task1_freq: 0,
  task1_time: 0,
  trouble_text: "",
};

export default function DiagnosisPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [consultSent, setConsultSent] = useState(false);
  const [consultSending, setConsultSending] = useState(false);
  const [consultError, setConsultError] = useState<string | null>(null);
  const [consultReplyEmail, setConsultReplyEmail] = useState("");
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
    setIsLoading(true);
    setResult(null);
    setConsultSent(false);
    setConsultError(null);
    setConsultReplyEmail("");

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data: ApiResponse = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        status: "error",
        message: "通信エラーが発生しました。もう一度お試しください。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsult = async () => {
    if (consultSent || consultSending) return;
    const email = consultReplyEmail.trim();
    if (!email) {
      setConsultError("返信用のメールアドレスを入力してください。");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setConsultError("有効なメールアドレスを入力してください。");
      return;
    }
    if (!window.confirm("相談リクエストを送信しますか？\n担当者よりご連絡いたします。")) return;
    setConsultSending(true);
    setConsultError(null);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consultEmail: CONSULT_EMAIL,
          replyEmail: email,
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          bottleneckTask: result?.bottleneckTask,
          monthlySavedCost: result?.monthlySavedCost,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setConsultSent(true);
      } else {
        setConsultError(data.message || "送信に失敗しました。");
      }
    } catch {
      setConsultError("送信に失敗しました。");
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
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            業務効率化診断
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            約3分で、AIがあなたの業務改善ポイントを分析します
          </p>
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
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                会社名
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => updateForm("company_name", e.target.value)}
                placeholder="例：株式会社○○"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                担当者名
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => updateForm("contact_name", e.target.value)}
                placeholder="例：山田 太郎"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
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
          <div>
            <input
              type="number"
              min={1}
              max={100}
              value={formData.backoffice_people || ""}
              onChange={(e) =>
                updateForm("backoffice_people", parseInt(e.target.value) || 1)
              }
              placeholder="例：5"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
            />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HOURLY_COST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateForm("hourly_cost", opt.value)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  formData.hourly_cost === opt.value
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
          <div className="space-y-3">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => updateForm("budget_level", opt.value)}
                className={`w-full py-3.5 px-4 rounded-xl text-left font-medium transition-all hover:scale-[1.01] ${
                  formData.budget_level === opt.value
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label}
              </button>
            ))}
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
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                業務の名称
              </label>
              <input
                type="text"
                value={formData.task1_name}
                onChange={(e) => updateForm("task1_name", e.target.value)}
                placeholder="例：月次請求書作成"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  1週間あたりの実施回数
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.task1_freq || ""}
                  onChange={(e) =>
                    updateForm("task1_freq", parseInt(e.target.value) || 0)
                  }
                  placeholder="例：4"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  1回あたりの作業時間（分）
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.task1_time || ""}
                  onChange={(e) =>
                    updateForm("task1_time", parseInt(e.target.value) || 0)
                  }
                  placeholder="例：60"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                />
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
            className="relative overflow-hidden group w-full max-w-md py-5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-soft-lg shadow-emerald-500/30 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
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
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setResult(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-soft-lg p-8 border border-slate-100"
            >
              {result.status === "success" ? (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                      <TrendingDown className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">
                      診断結果
                    </h3>
                  </div>

                  {result.bottleneckTask && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100"
                    >
                        <p className="text-sm font-medium text-slate-600 mb-2">
                          改善が必要な業務
                        </p>
                      <p className="text-lg font-semibold text-slate-800">
                        {result.bottleneckTask}
                      </p>
                    </motion.div>
                  )}

                  {result.monthlySavedCost !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100"
                    >
                        <p className="text-sm font-medium text-emerald-700 mb-1">
                          月あたりの削減見込み
                        </p>
                      <p className="text-2xl font-bold text-emerald-600">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {result.monthlySavedCost.toLocaleString()}円
                        </motion.span>
                        <span className="text-base font-normal text-emerald-600/80">
                          /月
                        </span>
                      </p>
                    </motion.div>
                  )}

                  {!consultSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="mb-4"
                    >
                      <label className="block text-sm font-medium text-slate-600 mb-2">
                        返信用メールアドレス（担当者からのご連絡先）
                      </label>
                      <input
                        type="email"
                        value={consultReplyEmail}
                        onChange={(e) => setConsultReplyEmail(e.target.value)}
                        placeholder="example@company.co.jp"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition"
                      />
                    </motion.div>
                  )}

                  <motion.button
                    type="button"
                    onClick={handleConsult}
                    disabled={consultSending || consultSent}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-glow hover:scale-[1.02] transition-all mb-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {consultSending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        送信中...
                      </>
                    ) : consultSent ? (
                      <>✓ 送信しました。担当者よりご連絡いたします。</>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        相談する
                      </>
                    )}
                  </motion.button>
                  {consultError && (
                    <p className="text-sm text-red-500 mb-4">{consultError}</p>
                  )}

                  <button
                    onClick={() => setResult(null)}
                    className="mt-2 w-full py-3 text-slate-500 hover:text-slate-700 text-sm"
                  >
                    閉じる
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-red-600 mb-4">
                    {result.message || "エラーが発生しました"}
                  </p>
                  <button
                    onClick={() => setResult(null)}
                    className="py-2 px-6 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    閉じる
                  </button>
                </div>
              )}
            </motion.div>
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
