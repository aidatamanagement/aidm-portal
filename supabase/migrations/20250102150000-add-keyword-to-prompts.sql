-- Add keyword column to prompts table for sorting and filtering
-- Migration: 20250102150000-add-keyword-to-prompts.sql

-- Add keyword column to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS keyword TEXT;

-- Add an index on the keyword column for better performance during sorting/filtering
CREATE INDEX IF NOT EXISTS idx_prompts_keyword ON prompts(keyword);

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN prompts.keyword IS 'Keywords for categorizing and sorting prompts'; 