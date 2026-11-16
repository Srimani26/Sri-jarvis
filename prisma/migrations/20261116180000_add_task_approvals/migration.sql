CREATE TABLE "task_approvals" (
  "id" TEXT NOT NULL,
  "task_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tool_name" TEXT NOT NULL,
  "action_digest" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "encrypted_checkpoint" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "decided_at" TIMESTAMP(3),
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "task_approvals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_approvals_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "agent_tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "task_approvals_task_id_status_expires_at_idx" ON "task_approvals"("task_id", "status", "expires_at");
CREATE INDEX "task_approvals_user_id_status_expires_at_idx" ON "task_approvals"("user_id", "status", "expires_at");
