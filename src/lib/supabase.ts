import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      ideas: {
        Row: {
          id: string
          created_at: string
          title: string
          domain: string
          problem: string
          ai_solution: string
          tags: string[]
          user_id: string
          like_user_ids: string[]
          stage: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          domain: string
          problem: string
          ai_solution: string
          tags?: string[]
          user_id: string
          like_user_ids?: string[]
          stage?: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          domain?: string
          problem?: string
          ai_solution?: string
          tags?: string[]
          user_id?: string
          like_user_ids?: string[]
          stage?: string
        }
      }
      teams: {
        Row: {
          id: string
          created_at: string
          idea_id: string
          name: string
          description: string
          max_members: number
          current_members: number
          required_skills: string[]
          leader_id: string
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          idea_id: string
          name: string
          description: string
          max_members: number
          current_members?: number
          required_skills?: string[]
          leader_id: string
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          idea_id?: string
          name?: string
          description?: string
          max_members?: number
          current_members?: number
          required_skills?: string[]
          leader_id?: string
          status?: string
        }
      }
      team_members: {
        Row: {
          id: string
          created_at: string
          team_id: string
          user_id: string
          role: string
          skills: string[]
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          team_id: string
          user_id: string
          role: string
          skills?: string[]
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          team_id?: string
          user_id?: string
          role?: string
          skills?: string[]
          status?: string
        }
      }
    }
  }
}