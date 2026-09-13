/**
 * Database types.
 *
 * Hand-written to match `supabase/migrations/0001_init.sql`. Once a project is
 * linked, replace this file wholesale with the generated version and delete
 * this note:
 *
 *   supabase gen types typescript --local > src/lib/supabase/database.types.ts
 *
 * Keeping a hand-written stub is what lets the repositories be fully typed
 * before a project exists. It is also the thing most likely to drift, so
 * generate over it at the first opportunity.
 */

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          language: 'en' | 'zh' | 'ms' | 'ta';
          reader: 'patient' | 'caregiver';
          year_of_birth: number | null;
          dietary_preferences: string[];
          allergies: string[];
          conditions: string[];
          medicines: string[];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      procedures: {
        Row: {
          id: string;
          patient_id: string;
          scheduled_for: string;
          arrive_at: string | null;
          hospital: string;
          location: string;
          department_phone: string;
          created_at: Timestamp;
        };
        Insert: Omit<Database['public']['Tables']['procedures']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['procedures']['Row']>;
        Relationships: [];
      };
      doses: {
        Row: {
          id: string;
          procedure_id: string;
          patient_id: string;
          label: string;
          scheduled_at: Timestamp;
          volume_ml: number;
          consumed_ml: number;
          started_at: Timestamp | null;
          completed_at: Timestamp | null;
        };
        Insert: Omit<Database['public']['Tables']['doses']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['doses']['Row']>;
        Relationships: [];
      };
      meal_checks: {
        Row: {
          id: string;
          patient_id: string;
          checked_at: Timestamp;
          verdict: 'ok' | 'avoid' | 'unsure';
          confidence: number;
          items: string[];
          reason: string;
        };
        Insert: Omit<Database['public']['Tables']['meal_checks']['Row'], 'id' | 'checked_at'> & {
          checked_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['meal_checks']['Row']>;
        Relationships: [];
      };
      stool_readings: {
        Row: {
          id: string;
          patient_id: string;
          read_at: Timestamp;
          point: number | null;
          confidence: number;
          inconclusive: boolean;
        };
        Insert: Omit<Database['public']['Tables']['stool_readings']['Row'], 'id' | 'read_at'> & {
          read_at?: Timestamp;
        };
        Update: Partial<Database['public']['Tables']['stool_readings']['Row']>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          patient_id: string;
          role: 'patient' | 'assistant';
          content: string;
          escalated: boolean;
          created_at: Timestamp;
        };
        // Insert-only from the Edge Function; the client policy is select-only.
        Insert: never;
        Update: never;
        Relationships: [];
      };
      flag_signals: {
        Row: {
          patient_id: string;
          diet_compliance: number;
          prep_timing: number;
          fluid_intake: number;
          bowel_output: number;
          updated_at: Timestamp;
        };
        Insert: Partial<Database['public']['Tables']['flag_signals']['Row']> & {
          patient_id: string;
        };
        Update: Partial<Database['public']['Tables']['flag_signals']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
