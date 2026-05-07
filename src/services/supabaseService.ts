import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface CogriAssessment {
  id?: string;
  company: string;
  symbol: string;
  sector: string;
  raw_score: number;
  normalized_score: number;
  assessed_at: string;
}

interface CohortStats {
  mean: number;
  stdDev: number;
  count: number;
}

class SupabaseService {
  private supabase: SupabaseClient | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {
      // Check if Supabase credentials are available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('Supabase credentials not found. Using fallback static cohort statistics.');
        return false;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.isInitialized = true;

      // Ensure table exists
      await this.ensureTableExists();

      return true;
    } catch (error) {
      console.error('Failed to initialize Supabase:', error);
      return false;
    }
  }

  private async ensureTableExists(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Try to query the table to check if it exists
      const { error } = await this.supabase
        .from('cogri_assessments')
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.warn('cogri_assessments table does not exist. Please create it in Supabase dashboard.');
        console.info(`
SQL to create the table:

CREATE TABLE IF NOT EXISTS cogri_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  symbol TEXT NOT NULL,
  sector TEXT NOT NULL,
  raw_score DECIMAL(10, 2) NOT NULL,
  normalized_score DECIMAL(10, 2) NOT NULL,
  assessed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_cogri_raw_score ON cogri_assessments(raw_score);
CREATE INDEX IF NOT EXISTS idx_cogri_assessed_at ON cogri_assessments(assessed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE cogri_assessments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "allow_public_read_cogri" ON cogri_assessments FOR SELECT TO public USING (true);

-- Allow authenticated users to insert
CREATE POLICY "allow_authenticated_insert_cogri" ON cogri_assessments FOR INSERT TO authenticated WITH CHECK (true);

-- Allow public insert (if you want anonymous assessments)
CREATE POLICY "allow_public_insert_cogri" ON cogri_assessments FOR INSERT TO public WITH CHECK (true);
        `);
      }
    } catch (error) {
      console.error('Error checking table existence:', error);
    }
  }

  async saveAssessment(assessment: Omit<CogriAssessment, 'id' | 'assessed_at'>): Promise<boolean> {
    if (!this.supabase || !this.isInitialized) {
      console.warn('Supabase not initialized. Assessment not saved.');
      return false;
    }

    try {
      const { error } = await this.supabase
        .from('cogri_assessments')
        .insert([
          {
            company: assessment.company,
            symbol: assessment.symbol,
            sector: assessment.sector,
            raw_score: assessment.raw_score,
            normalized_score: assessment.normalized_score,
            assessed_at: new Date().toISOString()
          }
        ]);

      if (error) {
        console.error('Error saving assessment:', error);
        return false;
      }

      console.log(`✅ Assessment saved for ${assessment.symbol}`);
      return true;
    } catch (error) {
      console.error('Failed to save assessment:', error);
      return false;
    }
  }

  async getCohortStatistics(): Promise<CohortStats | null> {
    if (!this.supabase || !this.isInitialized) {
      return null;
    }

    try {
      // Fetch all raw scores
      const { data, error } = await this.supabase
        .from('cogri_assessments')
        .select('raw_score');

      if (error) {
        console.error('Error fetching cohort statistics:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.warn('No assessments found in database. Using fallback statistics.');
        return null;
      }

      const rawScores = data.map(item => parseFloat(item.raw_score.toString()));
      const count = rawScores.length;

      // Calculate mean (μ)
      const mean = rawScores.reduce((sum, score) => sum + score, 0) / count;

      // Calculate standard deviation (σ)
      const variance = rawScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / count;
      const stdDev = Math.sqrt(variance);

      console.log(`📊 Dynamic Cohort Statistics: μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(2)}, n=${count}`);

      return {
        mean: parseFloat(mean.toFixed(2)),
        stdDev: parseFloat(stdDev.toFixed(2)),
        count
      };
    } catch (error) {
      console.error('Failed to calculate cohort statistics:', error);
      return null;
    }
  }

  async getRecentAssessments(limit: number = 100): Promise<CogriAssessment[]> {
    if (!this.supabase || !this.isInitialized) {
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('cogri_assessments')
        .select('*')
        .order('assessed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent assessments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch recent assessments:', error);
      return [];
    }
  }

  isConnected(): boolean {
    return this.isInitialized && this.supabase !== null;
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export type { CogriAssessment, CohortStats };