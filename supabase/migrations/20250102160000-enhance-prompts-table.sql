-- Enhance prompts table with description, persona, and category fields
-- Migration: 20250102160000-enhance-prompts-table.sql

-- Add new columns to prompts table
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS category_id INTEGER;

-- Create categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- No default categories - categories will be added through the admin interface

-- Add foreign key constraint
ALTER TABLE prompts 
ADD CONSTRAINT fk_prompts_category 
FOREIGN KEY (category_id) REFERENCES prompt_categories(id) ON DELETE SET NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompt_categories_name ON prompt_categories(name);

-- Add comments to document the new columns
COMMENT ON COLUMN prompts.description IS 'Brief description of the prompt purpose and usage';
COMMENT ON COLUMN prompts.persona IS 'Specific persona or character for the AI to adopt';
COMMENT ON COLUMN prompts.category_id IS 'Reference to the prompt category';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for prompt_categories table
CREATE TRIGGER update_prompt_categories_updated_at 
    BEFORE UPDATE ON prompt_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on prompt_categories table
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for prompt_categories
CREATE POLICY "Allow all authenticated users to view categories" 
ON prompt_categories FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admins to manage categories" 
ON prompt_categories FOR ALL 
USING (public.is_admin_user());
