-- Migration 001: Sovereign Swarm Tasks & Tool Execution Telemetry Schema
-- Persistent Audit Log for Neon PostgreSQL

CREATE TABLE IF NOT EXISTS swarm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  directive TEXT NOT NULL,
  specialist VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'RUNNING',
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS swarm_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES swarm_tasks(id) ON DELETE CASCADE,
  tool_name VARCHAR(100) NOT NULL,
  arguments JSONB,
  output JSONB,
  status VARCHAR(20),
  latency_ms INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swarm_tasks_status ON swarm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_swarm_tool_executions_task ON swarm_tool_executions(task_id);
