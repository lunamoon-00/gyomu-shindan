# B2B業務効率診断ツール — DB・バックエンド設計ガイド

Vercel（Next.js）で公開中の診断ツールに、診断データのDB保存・分析・将来のSaaS化を見据えた設計と実装手順をまとめます。

---

## 1. Supabase と Firebase の比較

| 観点 | Supabase | Firebase (Firestore) |
|------|----------|----------------------|
| **データモデル** | リレーショナル（PostgreSQL） | ドキュメント型（NoSQL） |
| **無料枠** | 500MB DB、50万リクエスト/月など | 1GB、5万読み/2万書き/日など |
| **分析・集計** | SQL（業種別・人数別・損失額の集計が容易） | 集計はクライアント or Cloud Functions で実装が必要 |
| **将来のSaaS** | マルチテナントをテーブル設計で表現しやすい | サブコレクションでテナント分離可能だが、集計はやや重い |
| **Next.js 連携** | サーバー/API Route から `@supabase/supabase-js` で簡単 | Admin SDK は Node 専用、クライアントは Firebase SDK |
| **学習コスト** | SQL が分かれば即扱いやすい | クエリの考え方が SQL と異なる |
| **推奨** | **◎ 本プロジェクト向き**（分析・SaaS を考えると有利） | リアルタイム・モバイル中心なら検討 |

**結論：診断データの保存・業種別・人数別・損失額などの分析、将来のSaaS化を考えると Supabase（PostgreSQL）を推奨します。** 無料枠で月 100〜1000 件は十分収まります。

---

## 2. 最適な DB 設計

### 2.1 想定スケール

- 診断送信：月 100〜1000 件
- 1 件あたりフォーム + 結果で 1〜2KB 程度としても、年間でも数 MB 以内
- 無料枠で開始し、必要に応じて Pro へ

### 2.2 テーブル設計

#### テーブル: `diagnoses`（診断 1 件 = 1 行）

保存する内容は、現在のフォーム（`FormData`）と API レスポンス（`ApiResponse`）を合わせた形にします。

| カラム名 | 型 | 説明 |
|----------|-----|------|
| `id` | `uuid` (PK, default: `gen_random_uuid()`) | 診断ID |
| `created_at` | `timestamptz` (default: `now()`) | 送信日時 |
| `company_name` | `text` | 会社名 |
| `contact_name` | `text` | 担当者名 |
| `backoffice_people` | `integer` | バックオフィス人数 |
| `hourly_cost` | `text` | 想定人件費（選択値） |
| `it_tools` | `text[]` または `jsonb` | 利用ツール（配列） |
| `it_literacy` | `smallint` | ITリテラシー 1–5 |
| `team_cooperation` | `smallint` | チーム連携 1–5 |
| `budget_level` | `text` | 導入予算感 |
| `task1_name` | `text` | 業務名（ボトルネック候補） |
| `task1_freq` | `integer` | 週あたり実施回数 |
| `task1_time` | `integer` | 1回あたり時間（分） |
| `trouble_text` | `text` | 困りごと（自由記述） |
| `bottleneck_task` | `text` | 診断結果：ボトルネック業務名 |
| `monthly_saved_cost` | `integer` | 診断結果：月間削減効果（円） |
| `lead_rank` | `text` | 結果：リードランク S/A/B（将来用） |
| `source` | `text` | 流入元（`web` / `api` など、将来用） |

- **業種**を将来入れる場合は `industry`（text または enum）を追加すると分析しやすいです。
- **マルチテナント（SaaS）**を見据える場合は、`tenant_id` (uuid) を追加し、RLS で `tenant_id` を条件にすると拡張しやすくなります。

#### インデックス（分析用）

```sql
-- 送信日で絞り込み・集計
CREATE INDEX idx_diagnoses_created_at ON diagnoses(created_at);

-- 業種別・人数規模別の集計用（カラム追加時）
-- CREATE INDEX idx_diagnoses_industry ON diagnoses(industry);
-- CREATE INDEX idx_diagnoses_backoffice_people ON diagnoses(backoffice_people);

-- 月別・損失額帯の分析用（月次集計など）
-- CREATE INDEX idx_diagnoses_created_at_monthly_saved ON diagnoses(date_trunc('month', created_at), monthly_saved_cost);
```

### 2.3 分析クエリ例（Supabase / SQL）

- 業種別件数（`industry` を追加している場合）  
  `SELECT industry, COUNT(*) FROM diagnoses GROUP BY industry;`
- 人数規模別の平均削減効果  
  `SELECT backoffice_people, AVG(monthly_saved_cost) FROM diagnoses GROUP BY backoffice_people;`
- 月別件数  
  `SELECT date_trunc('month', created_at) AS month, COUNT(*) FROM diagnoses GROUP BY 1 ORDER BY 1;`
- 損失額（削減効果）の分布  
  `SELECT monthly_saved_cost, COUNT(*) FROM diagnoses GROUP BY monthly_saved_cost ORDER BY 1;`

---

## 3. 実装手順（Supabase + Next.js API Route）

### 3.1 前提

- フロントは Next.js（Vercel）、診断送信は既存の「フォーム → `submitDiagnosis` → `/api/diagnosis`」の流れを利用します。
- **DB 保存は「診断 API の結果を返す直前（または直後）」に API Route 内で行う**形にすると、フロントの変更を最小にできます。

### 3.2 保存フロー

| モード | 保存経路 |
|--------|----------|
| **モック**（`NEXT_PUBLIC_USE_MOCK` 未設定 or `true`） | フロント → `POST /api/diagnosis/save` → Supabase |
| **本番**（GAS 利用時） | フロント → `POST /api/diagnosis` → GAS → 成功時 API 内で Supabase に insert |

### 3.3 手順概要

1. Supabase プロジェクト作成（supabase.com）
2. 環境変数に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を設定（Vercel の Environment Variables）
3. 上記スキーマで `diagnoses` テーブルを作成（Supabase SQL Editor で `supabase/migrations/001_diagnoses.sql` を実行）
4. `npm install` で `@supabase/supabase-js` を入れる
5. モック・本番どちらでも診断成功時に DB 保存される（実装済み）
6. （任意）管理用のダッシュボードや別 API で Supabase から読み取り

### 3.4 セキュリティの注意点

- **Service Role Key はサーバーだけ**  
  - `SUPABASE_SERVICE_ROLE_KEY` は API Route（サーバー）でのみ使用し、`NEXT_PUBLIC_*` にしないこと。
- **RLS（Row Level Security）**  
  - 本番では `diagnoses` に RLS を有効にし、**サービスロールは RLS をバイパスする**ため、API Route からだけ insert する設計にすれば、一般ユーザーがクライアントから直接テーブルを触れないようにできます。  
  - 将来、管理画面から Supabase にログインするユーザー用ポリシーを追加する想定でよいです。
- **入力検証**  
  - フォームは既存の `validateForm` で検証済み。API Route では「必須項目の存在」「数値範囲」「文字長」を再度チェックし、不正な payload は 400 で弾く。
- **レート制限**  
  - Vercel の機能や Upstash 等で、同一 IP や同一識別子ごとに「診断送信は N 回/分」など制限すると安心です。
- **個人情報**  
  - 会社名・担当者名・困りごと等は個人情報なので、本番では HTTPS のみとし、Supabase も「本番プロジェクト」で接続するようにする。

---

## 4. コード例

### 4.1 環境変数（.env.local / Vercel）

```env
# Supabase（サーバー専用。NEXT_PUBLIC_ にしない）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.2 マイグレーション（Supabase SQL Editor で実行）

```sql
-- diagnoses テーブル
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

-- RLS: 本番では有効化。サービスロールはバイパスするので API からの insert は可能
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;

-- ポリシー例: 認証済みユーザーには将来付与（現時点では insert は API 経由のみ）
-- CREATE POLICY "Allow service role" ON diagnoses FOR ALL USING (true);
```

### 4.3 Supabase クライアント（サーバー専用）

```ts
// lib/supabase-server.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

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

export { getSupabase };
```

### 4.4 診断データを DB 用に変換する関数

```ts
// lib/diagnosis-to-row.ts
import type { FormData } from "@/themes/efficiency/types";
import type { ApiResponse } from "@/themes/efficiency/types";
import type { DiagnosisRow } from "./supabase-server";

export function formAndResponseToRow(
  form: FormData,
  api: ApiResponse,
  source: string = "web"
): Omit<DiagnosisRow, "id" | "created_at"> {
  return {
    company_name: String(form.company_name ?? "").slice(0, 500),
    contact_name: String(form.contact_name ?? "").slice(0, 200),
    backoffice_people: Number(form.backoffice_people) || 0,
    hourly_cost: String(form.hourly_cost ?? "").slice(0, 50),
    it_tools: Array.isArray(form.it_tools) ? form.it_tools.slice(0, 50) : [],
    it_literacy:
      typeof form.it_literacy === "number" && form.it_literacy >= 1 && form.it_literacy <= 5
        ? form.it_literacy
        : null,
    team_cooperation:
      typeof form.team_cooperation === "number" &&
      form.team_cooperation >= 1 &&
      form.team_cooperation <= 5
        ? form.team_cooperation
        : null,
    budget_level: String(form.budget_level ?? "").slice(0, 50),
    task1_name: String(form.task1_name ?? "").slice(0, 300),
    task1_freq: Math.max(0, Math.min(10000, Number(form.task1_freq) || 0)),
    task1_time: Math.max(0, Math.min(10000, Number(form.task1_time) || 0)),
    trouble_text: String(form.trouble_text ?? "").slice(0, 2000),
    bottleneck_task: api.bottleneckTask?.slice(0, 300) ?? null,
    monthly_saved_cost:
      typeof api.monthlySavedCost === "number" && api.monthlySavedCost >= 0
        ? api.monthlySavedCost
        : null,
    lead_rank: "A",
    source,
  };
}
```

### 4.5 API Route で保存する例（/api/diagnosis の流れに組み込む）

既存の `app/api/diagnosis/route.ts` は「body を GAS に転送 → レスポンスをそのまま返す」なので、**成功レスポンスを返す直前に DB に 1 件 insert** する形にします。GAS がなくモックの場合は、モック成功レスポンスを返す前に DB に保存するか、または「本番 API 時のみ DB 保存」にしてもよいです。以下は「本番（GAS）応答が success のときだけ DB に保存」する例です。

```ts
// app/api/diagnosis/route.ts の POST 内で、成功時に行う処理の例

import { getSupabase } from "@/lib/supabase-server";
import { formAndResponseToRow } from "@/lib/diagnosis-to-row";

// ... 既存の request.json() や GAS への fetch、JSON 解析 ...

// data が success かつ status === "success" のとき
if (data && typeof data === "object" && (data as { status?: string }).status === "success") {
  const apiResponse = data as ApiResponse;
  try {
    const supabase = getSupabase();
    const row = formAndResponseToRow(body as FormData, apiResponse, "web");
    const { error } = await supabase.from("diagnoses").insert(row);
    if (error) {
      console.error("Diagnosis DB insert failed:", error);
      // ユーザーには成功を返したまま、ログだけ残す
    }
  } catch (err) {
    console.error("Diagnosis DB save error:", err);
  }
}

return NextResponse.json(data);
```

- 保存失敗しても**診断結果はそのまま返す**（ユーザー体験を優先）方針にしています。必須にしたい場合は `error` のときに 500 を返すように変更できます。
- **モック時**は、フロントから `POST /api/diagnosis/save` を呼び、そこで `insert` する実装済み（`page.tsx` で診断成功時に自動で呼ばれる）。

### 4.6 型の参照（API Route 用）

```ts
// 既存の themes/efficiency/types を利用
import type { FormData, ApiResponse } from "@/themes/efficiency/types";
```

---

## 5. まとめ

- **Supabase 推奨**：分析・SaaS を見据えると PostgreSQL の方が扱いやすいです。
- **DB 設計**：`diagnoses` 1 テーブルでフォーム＋結果を保存し、`created_at` や `monthly_saved_cost` 等でインデックスを張れば、業種別・人数別・損失額の分析がしやすいです。
- **実装**：既存の `/api/diagnosis` で「診断成功時だけ Supabase に insert」すると、フロント変更を抑えつつ保存できます。
- **セキュリティ**：Service Role はサーバーだけ、RLS 有効化、入力検証の二重チェック、レート制限と個人情報の取り扱いを意識してください。

このガイドとコード例をベースに、まずは Supabase で `diagnoses` を作成し、API Route に上記の insert を組み込むところから進めるとよいです。
