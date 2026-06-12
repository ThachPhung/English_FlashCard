-- Run once on existing PostgreSQL databases
ALTER TABLE study_sessions
    ADD COLUMN IF NOT EXISTS requeue_pending TEXT DEFAULT '{}';

ALTER TABLE review_logs
    ADD COLUMN IF NOT EXISTS requeue_snapshot TEXT;
