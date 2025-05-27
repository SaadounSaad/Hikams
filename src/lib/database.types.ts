// 🎯 SOLUTION IMMÉDIATE : Créez ce fichier : src/lib/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          id: string
          content: string
          source: string | null
          category: string
          ordre: number | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          source?: string | null
          category: string
          ordre?: number | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          source?: string | null
          category?: string
          ordre?: number | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_quotes: {
        Row: {
          id: string
          content: string
          source: string | null
          category: string
          ordre: number | null
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          source?: string | null
          category: string
          ordre?: number | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          source?: string | null
          category?: string
          ordre?: number | null
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      book_titles: {
        Row: {
          id: number
          book_name: string
          book_title: string
          ordre: number | null
          created_at: string
        }
        Insert: {
          id?: number
          book_name: string
          book_title: string
          ordre?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          book_name?: string
          book_title?: string
          ordre?: number | null
          created_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          category: string
          page_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          page_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          page_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      // Ajoutez d'autres tables selon votre schéma
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}