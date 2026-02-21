/**
 * Supabase サーバー用クライアント（API Route 専用）
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定の場合は null を返し、DB保存をスキップする
 *
 * 【セキュリティ】Service Role Key は絶対に NEXT_PUBLIC_ にしないこと
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/** 環境変数が設定されていれば Supabase クライアントを返す。未設定なら null */
export function getSupabase(): SupabaseClient | null {
  return getSupabaseClient();
}

/** Supabase が利用可能か */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

/** diagnoses テーブル 1 行の型（insert 用） */
export type DiagnosisRow = {
  id?: string;
  created_at?: string;
  company_name: string;
  contact_name: string;
  backoffice_people: number;
  hourly_cost: string;
  it_tools: string[];
  it_literacy: number | null;
  team_cooperation: number | null;
  budget_level: string;
  task1_name: string;
  task1_freq: number;
  task1_time: number;
  trouble_text: string;
  bottleneck_task: string | null;
  monthly_saved_cost: number | null;
  lead_rank: string;
  source: string;
};
