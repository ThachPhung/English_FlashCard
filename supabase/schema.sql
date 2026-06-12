-- English Flashcard App — PostgreSQL schema for Supabase
-- Run in Supabase SQL Editor after creating the project.

-- Enums (match SQLAlchemy model values)
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE deck_visibility AS ENUM ('private', 'shared');
CREATE TYPE card_status AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MASTERED', 'SUSPENDED');
CREATE TYPE rating AS ENUM ('AGAIN', 'HARD', 'GOOD', 'EASY');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    daily_new_limit INTEGER NOT NULL DEFAULT 20,
    daily_review_limit INTEGER NOT NULL DEFAULT 100,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(10) NOT NULL DEFAULT 'light'
);

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    front_language VARCHAR(20) NOT NULL DEFAULT 'English',
    back_language VARCHAR(20) NOT NULL DEFAULT 'Vietnamese',
    visibility deck_visibility NOT NULL DEFAULT 'private',
    new_cards_per_day INTEGER NOT NULL DEFAULT 20,
    review_limit_per_day INTEGER NOT NULL DEFAULT 100,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_decks_owner_id ON decks(owner_id);

CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front VARCHAR(255) NOT NULL,
    back TEXT NOT NULL,
    phonetic VARCHAR(100),
    part_of_speech VARCHAR(50),
    example TEXT,
    example_translation TEXT,
    notes TEXT,
    tags VARCHAR(500),
    image_url VARCHAR(500),
    audio_url VARCHAR(500),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_cards_deck_id ON cards(deck_id);

CREATE TABLE study_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_id INTEGER REFERENCES decks(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_cards INTEGER NOT NULL DEFAULT 0,
    completed_cards INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    status session_status NOT NULL DEFAULT 'active',
    requeue_pending TEXT DEFAULT '{}',
    session_card_ids TEXT DEFAULT '[]'
);

CREATE INDEX ix_study_sessions_user_id ON study_sessions(user_id);

CREATE TABLE user_card_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    status card_status NOT NULL DEFAULT 'NEW',
    interval_days DOUBLE PRECISION NOT NULL DEFAULT 0,
    due_at TIMESTAMPTZ,
    repetitions INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_rating rating,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_card UNIQUE (user_id, card_id)
);

CREATE INDEX ix_user_card_progress_user_id ON user_card_progress(user_id);
CREATE INDEX ix_user_card_progress_card_id ON user_card_progress(card_id);

CREATE TABLE review_logs (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES study_sessions(id) ON DELETE SET NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    rating rating NOT NULL,
    old_interval DOUBLE PRECISION NOT NULL DEFAULT 0,
    new_interval DOUBLE PRECISION NOT NULL DEFAULT 0,
    old_due_at TIMESTAMPTZ,
    new_due_at TIMESTAMPTZ,
    response_time_ms INTEGER,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_undone BOOLEAN NOT NULL DEFAULT FALSE,
    requeue_snapshot TEXT
);

CREATE INDEX ix_review_logs_user_id ON review_logs(user_id);
CREATE INDEX ix_review_logs_card_id ON review_logs(card_id);

-- Reset sequences after manual ID migration
CREATE OR REPLACE FUNCTION reset_serial_sequences()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT c.relname AS table_name, a.attname AS column_name, s.relname AS seq_name
        FROM pg_class c
        JOIN pg_attribute a ON a.attrelid = c.oid
        JOIN pg_depend d ON d.objid = c.oid
        JOIN pg_class s ON s.oid = d.objid
        WHERE c.relkind = 'r'
          AND s.relkind = 'S'
          AND a.attnum > 0
          AND NOT a.attisdropped
          AND c.relname IN (
              'users', 'user_settings', 'decks', 'cards',
              'study_sessions', 'user_card_progress', 'review_logs'
          )
    LOOP
        EXECUTE format(
            'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1))',
            r.seq_name, r.column_name, r.table_name
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
