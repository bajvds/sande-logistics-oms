import { createClient } from '@supabase/supabase-js';
import { DatabaseOrderTableRow } from '@/types';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database type for better type safety with Supabase
export type Database = {
  public: {
    Tables: {
      orders: {
        Row: DatabaseOrderTableRow;
        Insert: Omit<DatabaseOrderTableRow, 'id' | 'created_at'>;
        Update: Partial<Omit<DatabaseOrderTableRow, 'id' | 'created_at'>>;
      };
    };
  };
};


