-- 診断結果保存用テーブル（Supabase SQL Editor で実行、または supabase db push）
-- 詳細: docs/DB_AND_BACKEND_GUIDE.md

CREATE TABLE IF NOT EXISTS diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  backoffice_people integer NOT NULL,
  hourly_cost text NOT NULL,
  it_tools text[] DEFAULT '{}',
  it_literacy smallint,
  team_cooperation smallint,
  budget_level text NOT NULL,
  task1_name text NOT NULL,
  task1_freq integer NOT NULL,
  task1_time integer NOT NULL,
  trouble_text text DEFAULT '',
  bottleneck_task text,
  monthly_saved_cost integer,
  lead_rank text DEFAULT 'A',
  source text DEFAULT 'web'
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_created_at ON diagnoses(created_at);

ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- サービスロールは RLS をバイパスするため、API Route からの insert は可能
-- 一般ユーザーがクライアントから直接テーブルにアクセスしない設計
