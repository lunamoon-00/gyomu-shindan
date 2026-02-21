/**
 * 相談フォーム
 * 返信用メール + 送信ボタン
 */
"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";

interface ConsultationFormProps {
  onSubmit: (email: string) => Promise<void>;
  isSending: boolean;
  isSent: boolean;
  error: string | null;
}

export function ConsultationForm({
  onSubmit,
  isSending,
  isSent,
  error,
}: ConsultationFormProps) {
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim() || isSending || isSent) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError("正しいメールアドレスを入力してください。");
      return;
    }
    if (!window.confirm("相談リクエストを送信しますか？")) return;
    await onSubmit(email);
  };

  if (isSent) {
    return (
      <div className="p-4 rounded-xl bg-lavender-50 border border-lavender-200 text-center">
        <p className="text-navy-700 font-medium">✓ 送信しました。担当者よりご連絡いたします。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-navy-700">
        返信用メールアドレス
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setLocalError(null);
        }}
        placeholder="example@company.co.jp"
        className="w-full px-4 py-3 rounded-xl border border-lavender-300 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 outline-none"
      />
      {(error || localError) && (
        <p className="text-sm text-red-600">{error ?? localError}</p>
      )}
      <button
        type="submit"
        disabled={isSending || !email.trim()}
        className="w-full py-4 px-6 rounded-xl bg-navy-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            送信中...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" />
            診断内容について相談する
          </>
        )}
      </button>
    </form>
  );
}
