-- YKS Question Archive - Database Schema
-- Run this in Supabase SQL Editor

-- Enum types
CREATE TYPE subject_enum AS ENUM (
  'math',
  'geometry',
  'physics',
  'chemistry',
  'biology',
  'turkish',
  'history',
  'geography',
  'philosophy',
  'religion',
  'english'
);

-- Main questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255),

  -- File paths
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,

  -- Categorization
  subject subject_enum NOT NULL,
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',

  -- Status information
  is_favorite BOOLEAN DEFAULT FALSE,
  is_solved BOOLEAN DEFAULT FALSE,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_is_favorite ON questions(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_questions_is_solved ON questions(is_solved);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_tags ON questions USING GIN(tags);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_questions_search ON questions USING GIN(
  to_tsvector('turkish', COALESCE(title, '') || ' ' || COALESCE(notes, ''))
);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('question-images', 'question-images', true),
  ('question-thumbnails', 'question-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies (Phase 1 - simple, single user)
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Temporary public access (Phase 1)
-- Will be updated when authentication is added in Phase 2
CREATE POLICY "Enable all access for development" ON questions
  FOR ALL USING (true) WITH CHECK (true);

-- Storage policies
CREATE POLICY "Enable all access for question images" ON storage.objects
  FOR ALL USING (bucket_id = 'question-images') WITH CHECK (bucket_id = 'question-images');

CREATE POLICY "Enable all access for question thumbnails" ON storage.objects
  FOR ALL USING (bucket_id = 'question-thumbnails') WITH CHECK (bucket_id = 'question-thumbnails');