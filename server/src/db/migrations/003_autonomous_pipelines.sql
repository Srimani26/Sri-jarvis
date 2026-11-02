-- 003_autonomous_pipelines.sql — Autonomous Pipelines & Milestone Tracking
-- Neon DB & PostgreSQL durable schema for multi-agent DAG execution

CREATE TABLE IF NOT EXISTS autonomous_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  goal TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'PLANNING', -- 'PLANNING', 'IN_PROGRESS', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'
  assigned_agents TEXT[] NOT NULL,
  total_steps INTEGER NOT NULL,
  completed_steps INTEGER DEFAULT 0,
  estimated_duration_sec INTEGER,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  preview_url TEXT,
  deliverable_artifacts JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS pipeline_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES autonomous_pipelines(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name VARCHAR(150) NOT NULL,
  specialist VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED'
  output_summary TEXT,
  latency_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_pipelines_status ON autonomous_pipelines(status);
CREATE INDEX IF NOT EXISTS idx_milestones_pipeline_id ON pipeline_milestones(pipeline_id);
