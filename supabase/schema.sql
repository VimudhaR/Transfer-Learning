-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Table to store individual clinical analysis results
create table if not exists clinical_analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  input_text text not null,
  model_used text not null,
  analysis_type text not null, -- 'NER', 'Summarization', 'QA', 'Comparison', 'Batch NER'
  results jsonb, -- Store the full JSON result from the AI
  confidence_score float
);

-- Table to store extracted entities for analytics
create table if not exists extracted_entities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  analysis_id uuid references clinical_analyses(id),
  entity_text text not null,
  entity_type text not null,
  confidence float,
  start_pos int,
  end_pos int
);

-- Table to track batch processing jobs
create table if not exists batch_analyses (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  batch_name text,
  total_documents int,
  completed_documents int default 0,
  status text, -- 'processing', 'completed', 'failed'
  completed_at timestamp with time zone,
  results_summary jsonb
);

-- Table to track aggregate model performance
create table if not exists model_performance (
  id uuid default gen_random_uuid() primary key,
  model_name text unique not null,
  analysis_count int default 0,
  avg_confidence float default 0,
  total_entities_extracted int default 0,
  last_used timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Function to safely update model stats (called via RPC)
create or replace function update_model_stats(
  _model_name text,
  _confidence float,
  _entity_count int
)
returns void
language plpgsql
as $$
begin
  insert into model_performance (model_name, analysis_count, avg_confidence, total_entities_extracted, last_used, updated_at)
  values (_model_name, 1, _confidence, _entity_count, now(), now())
  on conflict (model_name)
  do update set
    analysis_count = model_performance.analysis_count + 1,
    avg_confidence = (model_performance.avg_confidence * model_performance.analysis_count + _confidence) / (model_performance.analysis_count + 1),
    total_entities_extracted = model_performance.total_entities_extracted + _entity_count,
    last_used = now(),
    updated_at = now();
end;
$$;

-- RLS Policies (Enable access for anonymous users for this demo)
alter table clinical_analyses enable row level security;
alter table extracted_entities enable row level security;
alter table batch_analyses enable row level security;
alter table model_performance enable row level security;

create policy "Allow anonymous inserts" on clinical_analyses for insert with check (true);
create policy "Allow anonymous selects" on clinical_analyses for select using (true);

create policy "Allow anonymous inserts entities" on extracted_entities for insert with check (true);
create policy "Allow anonymous selects entities" on extracted_entities for select using (true);

create policy "Allow anonymous inserts batch" on batch_analyses for insert with check (true);
create policy "Allow anonymous updates batch" on batch_analyses for update using (true);
create policy "Allow anonymous selects batch" on batch_analyses for select using (true);

create policy "Allow anonymous inserts models" on model_performance for insert with check (true);
create policy "Allow anonymous updates models" on model_performance for update using (true);
create policy "Allow anonymous selects models" on model_performance for select using (true);
