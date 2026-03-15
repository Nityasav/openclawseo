export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          plan?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          org_id: string | null;
          role: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          org_id?: string | null;
          role?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          role?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      sites: {
        Row: {
          id: string;
          org_id: string;
          domain: string;
          gsc_property_url: string | null;
          ga4_property_id: string | null;
          framer_project_id: string | null;
          is_sandbox: boolean;
          sandbox_expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          domain: string;
          gsc_property_url?: string | null;
          ga4_property_id?: string | null;
          framer_project_id?: string | null;
          is_sandbox?: boolean;
          sandbox_expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          domain?: string;
          gsc_property_url?: string | null;
          ga4_property_id?: string | null;
          framer_project_id?: string | null;
          is_sandbox?: boolean;
          sandbox_expires_at?: string | null;
          created_at?: string;
        };
      };
      keywords: {
        Row: {
          id: string;
          site_id: string;
          keyword: string;
          current_position: number | null;
          previous_position: number | null;
          search_volume: number | null;
          difficulty: number | null;
          opportunity_score: number | null;
          last_checked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          keyword: string;
          current_position?: number | null;
          previous_position?: number | null;
          search_volume?: number | null;
          difficulty?: number | null;
          opportunity_score?: number | null;
          last_checked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          keyword?: string;
          current_position?: number | null;
          previous_position?: number | null;
          search_volume?: number | null;
          difficulty?: number | null;
          opportunity_score?: number | null;
          last_checked_at?: string | null;
          created_at?: string;
        };
      };
      geo_records: {
        Row: {
          id: string;
          site_id: string;
          query: string;
          llm_source: string | null;
          is_cited: boolean;
          citation_url: string | null;
          schema_injected: boolean;
          checked_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          query: string;
          llm_source?: string | null;
          is_cited?: boolean;
          citation_url?: string | null;
          schema_injected?: boolean;
          checked_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          query?: string;
          llm_source?: string | null;
          is_cited?: boolean;
          citation_url?: string | null;
          schema_injected?: boolean;
          checked_at?: string;
        };
      };
      agent_runs: {
        Row: {
          id: string;
          site_id: string;
          run_type: string;
          status: string;
          result_json: Json | null;
          error_message: string | null;
          tokens_used: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          run_type: string;
          status?: string;
          result_json?: Json | null;
          error_message?: string | null;
          tokens_used?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          run_type?: string;
          status?: string;
          result_json?: Json | null;
          error_message?: string | null;
          tokens_used?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          site_id: string;
          agent_run_id: string | null;
          title: string | null;
          summary: string | null;
          report_json: Json | null;
          delivered_to_slack: boolean;
          delivered_to_email: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          agent_run_id?: string | null;
          title?: string | null;
          summary?: string | null;
          report_json?: Json | null;
          delivered_to_slack?: boolean;
          delivered_to_email?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          site_id?: string;
          agent_run_id?: string | null;
          title?: string | null;
          summary?: string | null;
          report_json?: Json | null;
          delivered_to_slack?: boolean;
          delivered_to_email?: boolean;
          created_at?: string;
        };
      };
      sandbox_environments: {
        Row: {
          id: string;
          org_id: string | null;
          template: string;
          status: string;
          container_id: string | null;
          access_token: string;
          role: string;
          expires_at: string;
          session_recording_url: string | null;
          created_at: string;
          scenario_name: string | null;
          scenario_config: Json | null;
          walkthrough_steps: Json;
          is_template: boolean;
        };
        Insert: {
          id?: string;
          org_id?: string | null;
          template: string;
          status?: string;
          container_id?: string | null;
          access_token: string;
          role?: string;
          expires_at?: string;
          session_recording_url?: string | null;
          created_at?: string;
          scenario_name?: string | null;
          scenario_config?: Json | null;
          walkthrough_steps?: Json;
          is_template?: boolean;
        };
        Update: {
          id?: string;
          org_id?: string | null;
          template?: string;
          status?: string;
          container_id?: string | null;
          access_token?: string;
          role?: string;
          expires_at?: string;
          session_recording_url?: string | null;
          created_at?: string;
          scenario_name?: string | null;
          scenario_config?: Json | null;
          walkthrough_steps?: Json;
          is_template?: boolean;
        };
      };
      integrations: {
        Row: {
          id: string;
          org_id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          config_json: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          config_json?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          provider?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          config_json?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}
