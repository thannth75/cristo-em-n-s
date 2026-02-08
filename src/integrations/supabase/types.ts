export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string | null
          description: string
          icon: string
          id: string
          name: string
          points: number | null
        }
        Insert: {
          category?: string | null
          description: string
          icon: string
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          category?: string | null
          description?: string
          icon?: string
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      admin_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          id: string
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          id?: string
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          checked_by: string | null
          checked_in_at: string
          event_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          checked_by?: string | null
          checked_in_at?: string
          event_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          checked_by?: string | null
          checked_in_at?: string
          event_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_devotional_log: {
        Row: {
          devotional_id: string | null
          generated_at: string
          id: string
          model_used: string | null
          prompt_used: string | null
        }
        Insert: {
          devotional_id?: string | null
          generated_at?: string
          id?: string
          model_used?: string | null
          prompt_used?: string | null
        }
        Update: {
          devotional_id?: string | null
          generated_at?: string
          id?: string
          model_used?: string | null
          prompt_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_devotional_log_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "daily_devotionals"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_book_content: {
        Row: {
          application: string | null
          approximate_date: string | null
          author: string | null
          book_name: string
          book_order: number
          category: string | null
          chapters_count: number
          created_at: string
          historical_context: string | null
          id: string
          key_themes: string[] | null
          key_verses: string[] | null
          summary: string
          testament: string
        }
        Insert: {
          application?: string | null
          approximate_date?: string | null
          author?: string | null
          book_name: string
          book_order: number
          category?: string | null
          chapters_count: number
          created_at?: string
          historical_context?: string | null
          id?: string
          key_themes?: string[] | null
          key_verses?: string[] | null
          summary: string
          testament: string
        }
        Update: {
          application?: string | null
          approximate_date?: string | null
          author?: string | null
          book_name?: string
          book_order?: number
          category?: string | null
          chapters_count?: number
          created_at?: string
          historical_context?: string | null
          id?: string
          key_themes?: string[] | null
          key_verses?: string[] | null
          summary?: string
          testament?: string
        }
        Relationships: []
      }
      bible_quizzes: {
        Row: {
          book: string | null
          created_at: string
          created_by: string
          description: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          points_reward: number | null
          title: string
        }
        Insert: {
          book?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          title: string
        }
        Update: {
          book?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          points_reward?: number | null
          title?: string
        }
        Relationships: []
      }
      bible_studies: {
        Row: {
          book: string
          chapters: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          start_date: string | null
          title: string
        }
        Insert: {
          book: string
          chapters?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          title: string
        }
        Update: {
          book?: string
          chapters?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
      cell_meeting_attendance: {
        Row: {
          attended_at: string | null
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          attended_at?: string | null
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          attended_at?: string | null
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cell_meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "cell_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      cell_meetings: {
        Row: {
          attendance_count: number | null
          cell_id: string
          created_at: string | null
          created_by: string
          id: string
          meeting_date: string
          notes: string | null
          topic: string | null
        }
        Insert: {
          attendance_count?: number | null
          cell_id: string
          created_at?: string | null
          created_by: string
          id?: string
          meeting_date: string
          notes?: string | null
          topic?: string | null
        }
        Update: {
          attendance_count?: number | null
          cell_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          meeting_date?: string
          notes?: string | null
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cell_meetings_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
        ]
      }
      cell_members: {
        Row: {
          cell_id: string
          id: string
          joined_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          cell_id: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          cell_id?: string
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cell_members_cell_id_fkey"
            columns: ["cell_id"]
            isOneToOne: false
            referencedRelation: "cells"
            referencedColumns: ["id"]
          },
        ]
      }
      cells: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          leader_id: string
          meeting_day: string | null
          meeting_location: string | null
          meeting_time: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_id: string
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          leader_id?: string
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_public: boolean
          member_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_public?: boolean
          member_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_public?: boolean
          member_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          reposts_count: number | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          reposts_count?: number | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          reposts_count?: number | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      daily_devotionals: {
        Row: {
          bible_reference: string
          bible_verse: string
          content: string
          created_at: string
          created_by: string
          devotional_date: string
          id: string
          is_auto_generated: boolean | null
          prayer_focus: string | null
          reflection_questions: string[] | null
          title: string
        }
        Insert: {
          bible_reference: string
          bible_verse: string
          content: string
          created_at?: string
          created_by: string
          devotional_date: string
          id?: string
          is_auto_generated?: boolean | null
          prayer_focus?: string | null
          reflection_questions?: string[] | null
          title: string
        }
        Update: {
          bible_reference?: string
          bible_verse?: string
          content?: string
          created_at?: string
          created_by?: string
          devotional_date?: string
          id?: string
          is_auto_generated?: boolean | null
          prayer_focus?: string | null
          reflection_questions?: string[] | null
          title?: string
        }
        Relationships: []
      }
      daily_reading_checkins: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          plan_day_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          plan_day_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          plan_day_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reading_checkins_plan_day_id_fkey"
            columns: ["plan_day_id"]
            isOneToOne: false
            referencedRelation: "reading_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      devotional_progress: {
        Row: {
          completed_at: string
          devotional_id: string
          id: string
          personal_reflection: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          devotional_id: string
          id?: string
          personal_reflection?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          devotional_id?: string
          id?: string
          personal_reflection?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "devotional_progress_devotional_id_fkey"
            columns: ["devotional_id"]
            isOneToOne: false
            referencedRelation: "daily_devotionals"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship: {
        Row: {
          created_at: string | null
          disciple_id: string
          ended_at: string | null
          id: string
          is_active: boolean | null
          mentor_id: string
          notes: string | null
          started_at: string | null
        }
        Insert: {
          created_at?: string | null
          disciple_id: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id: string
          notes?: string | null
          started_at?: string | null
        }
        Update: {
          created_at?: string | null
          disciple_id?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id?: string
          notes?: string | null
          started_at?: string | null
        }
        Relationships: []
      }
      discipleship_checkins: {
        Row: {
          bible_reading: boolean | null
          challenges: string | null
          checkin_date: string
          community_involvement: boolean | null
          created_at: string | null
          discipleship_id: string
          id: string
          mentor_feedback: string | null
          prayer_life: boolean | null
          prayer_requests: string | null
          spiritual_health: number | null
          victories: string | null
        }
        Insert: {
          bible_reading?: boolean | null
          challenges?: string | null
          checkin_date?: string
          community_involvement?: boolean | null
          created_at?: string | null
          discipleship_id: string
          id?: string
          mentor_feedback?: string | null
          prayer_life?: boolean | null
          prayer_requests?: string | null
          spiritual_health?: number | null
          victories?: string | null
        }
        Update: {
          bible_reading?: boolean | null
          challenges?: string | null
          checkin_date?: string
          community_involvement?: boolean | null
          created_at?: string | null
          discipleship_id?: string
          id?: string
          mentor_feedback?: string | null
          prayer_life?: boolean | null
          prayer_requests?: string | null
          spiritual_health?: number | null
          victories?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_checkins_discipleship_id_fkey"
            columns: ["discipleship_id"]
            isOneToOne: false
            referencedRelation: "discipleship"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          discipleship_id: string
          id: string
          is_completed: boolean | null
          target_date: string | null
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          discipleship_id: string
          id?: string
          is_completed?: boolean | null
          target_date?: string | null
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          discipleship_id?: string
          id?: string
          is_completed?: boolean | null
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_goals_discipleship_id_fkey"
            columns: ["discipleship_id"]
            isOneToOne: false
            referencedRelation: "discipleship"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          location?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_grades: {
        Row: {
          exam_id: string
          graded_at: string
          graded_by: string
          id: string
          notes: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          exam_id: string
          graded_at?: string
          graded_by: string
          id?: string
          notes?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          exam_id?: string
          graded_at?: string
          graded_by?: string
          id?: string
          notes?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_grades_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          exam_date: string
          exam_type: string
          id: string
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          exam_date?: string
          exam_type?: string
          id?: string
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          exam_date?: string
          exam_type?: string
          id?: string
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          bible_verse: string | null
          content: string
          created_at: string
          id: string
          mood: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bible_verse?: string | null
          content: string
          created_at?: string
          id?: string
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bible_verse?: string | null
          content?: string
          created_at?: string
          id?: string
          mood?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      level_definitions: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          level_number: number
          rewards: string[] | null
          title: string
          xp_required: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level_number: number
          rewards?: string[] | null
          title: string
          xp_required: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          level_number?: number
          rewards?: string[] | null
          title?: string
          xp_required?: number
        }
        Relationships: []
      }
      milestones: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          requirement_activity: string | null
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description: string
          icon: string
          id?: string
          is_active?: boolean | null
          name: string
          requirement_activity?: string | null
          requirement_type: string
          requirement_value: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          requirement_activity?: string | null
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      mood_verses: {
        Row: {
          created_at: string
          encouragement: string | null
          id: string
          mood: string
          prayer_suggestion: string | null
          verse_reference: string
          verse_text: string
        }
        Insert: {
          created_at?: string
          encouragement?: string | null
          id?: string
          mood: string
          prayer_suggestion?: string | null
          verse_reference: string
          verse_text: string
        }
        Update: {
          created_at?: string
          encouragement?: string | null
          id?: string
          mood?: string
          prayer_suggestion?: string | null
          verse_reference?: string
          verse_text?: string
        }
        Relationships: []
      }
      music_scales: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_scales_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      musicians: {
        Row: {
          created_at: string
          id: string
          instruments: string[]
          is_active: boolean
          skill_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instruments?: string[]
          is_active?: boolean
          skill_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instruments?: string[]
          is_active?: boolean
          skill_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievements_enabled: boolean | null
          community_enabled: boolean | null
          created_at: string
          devotionals_enabled: boolean | null
          events_enabled: boolean | null
          id: string
          prayers_enabled: boolean | null
          push_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          achievements_enabled?: boolean | null
          community_enabled?: boolean | null
          created_at?: string
          devotionals_enabled?: boolean | null
          events_enabled?: boolean | null
          id?: string
          prayers_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          achievements_enabled?: boolean | null
          community_enabled?: boolean | null
          created_at?: string
          devotionals_enabled?: boolean | null
          events_enabled?: boolean | null
          id?: string
          prayers_enabled?: boolean | null
          push_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          step_location: boolean | null
          step_notifications: boolean | null
          step_profile: boolean | null
          step_tutorial: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_location?: boolean | null
          step_notifications?: boolean | null
          step_profile?: boolean | null
          step_tutorial?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          step_location?: boolean | null
          step_notifications?: boolean | null
          step_profile?: boolean | null
          step_tutorial?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_mentions: {
        Row: {
          created_at: string
          id: string
          mentioned_user_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentioned_user_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentioned_user_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_mentions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          original_post_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          original_post_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          original_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          prayer_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prayer_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prayer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_comments_prayer_id_fkey"
            columns: ["prayer_id"]
            isOneToOne: false
            referencedRelation: "prayer_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_reminders: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          reminder_time: string
          reminder_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reminder_time: string
          reminder_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          reminder_time?: string
          reminder_type?: string
          user_id?: string
        }
        Relationships: []
      }
      prayer_requests: {
        Row: {
          answered_at: string | null
          content: string
          created_at: string
          id: string
          is_answered: boolean | null
          is_private: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          content: string
          created_at?: string
          id?: string
          is_answered?: boolean | null
          is_private?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answered_at?: string | null
          content?: string
          created_at?: string
          id?: string
          is_answered?: boolean | null
          is_private?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          profile_user_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          profile_user_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          profile_user_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          current_level: number | null
          email: string
          full_name: string
          id: string
          is_approved: boolean | null
          last_seen: string | null
          phone: string | null
          state: string | null
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          current_level?: number | null
          email: string
          full_name: string
          id?: string
          is_approved?: boolean | null
          last_seen?: string | null
          phone?: string | null
          state?: string | null
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          current_level?: number | null
          email?: string
          full_name?: string
          id?: string
          is_approved?: boolean | null
          last_seen?: string | null
          phone?: string | null
          state?: string | null
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string | null
          id: string
          options: string[]
          order_position: number | null
          points: number | null
          question: string
          quiz_id: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          explanation?: string | null
          id?: string
          options: string[]
          order_position?: number | null
          points?: number | null
          question: string
          quiz_id: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: string[]
          order_position?: number | null
          points?: number | null
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "bible_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_days: {
        Row: {
          book: string | null
          chapter_end: number | null
          chapter_start: number | null
          created_at: string
          day_number: number
          id: string
          plan_id: string
          readings: string[]
          title: string
        }
        Insert: {
          book?: string | null
          chapter_end?: number | null
          chapter_start?: number | null
          created_at?: string
          day_number: number
          id?: string
          plan_id: string
          readings: string[]
          title: string
        }
        Update: {
          book?: string | null
          chapter_end?: number | null
          chapter_start?: number | null
          created_at?: string
          day_number?: number
          id?: string
          plan_id?: string
          readings?: string[]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          plan_type: string
          total_days: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          plan_type?: string
          total_days?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          plan_type?: string
          total_days?: number
        }
        Relationships: []
      }
      routine_daily_checkins: {
        Row: {
          completed_at: string
          id: string
          reflection_notes: string | null
          routine_day_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          reflection_notes?: string | null
          routine_day_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          reflection_notes?: string | null
          routine_day_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_daily_checkins_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "spiritual_routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_stories: {
        Row: {
          id: string
          saved_at: string
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          saved_at?: string
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          saved_at?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      scale_musicians: {
        Row: {
          confirmed: boolean | null
          id: string
          instrument: string
          musician_id: string
          role: string | null
          scale_id: string
        }
        Insert: {
          confirmed?: boolean | null
          id?: string
          instrument: string
          musician_id: string
          role?: string | null
          scale_id: string
        }
        Update: {
          confirmed?: boolean | null
          id?: string
          instrument?: string
          musician_id?: string
          role?: string | null
          scale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_musicians_musician_id_fkey"
            columns: ["musician_id"]
            isOneToOne: false
            referencedRelation: "musicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scale_musicians_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "music_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      scale_songs: {
        Row: {
          id: string
          key_override: string | null
          order_position: number
          scale_id: string
          song_id: string
        }
        Insert: {
          id?: string
          key_override?: string | null
          order_position?: number
          scale_id: string
          song_id: string
        }
        Update: {
          id?: string
          key_override?: string | null
          order_position?: number
          scale_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scale_songs_scale_id_fkey"
            columns: ["scale_id"]
            isOneToOne: false
            referencedRelation: "music_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scale_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          target_id: string | null
          target_table: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          target_id?: string | null
          target_table?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      songs: {
        Row: {
          artist: string | null
          chords_url: string | null
          created_at: string
          created_by: string
          id: string
          key: string | null
          lyrics_url: string | null
          tempo: number | null
          title: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          chords_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          key?: string | null
          lyrics_url?: string | null
          tempo?: number | null
          title: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          chords_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          key?: string | null
          lyrics_url?: string | null
          tempo?: number | null
          title?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      spiritual_routine_days: {
        Row: {
          action_item: string | null
          bible_reading: string | null
          created_at: string
          day_number: number
          description: string | null
          id: string
          plan_id: string
          reflection_prompt: string | null
          title: string
        }
        Insert: {
          action_item?: string | null
          bible_reading?: string | null
          created_at?: string
          day_number: number
          description?: string | null
          id?: string
          plan_id: string
          reflection_prompt?: string | null
          title: string
        }
        Update: {
          action_item?: string | null
          bible_reading?: string | null
          created_at?: string
          day_number?: number
          description?: string | null
          id?: string
          plan_id?: string
          reflection_prompt?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "spiritual_routine_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "spiritual_routine_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      spiritual_routine_plans: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      study_progress: {
        Row: {
          chapters_completed: string[] | null
          completed_at: string | null
          id: string
          notes: string | null
          study_id: string
          user_id: string
        }
        Insert: {
          chapters_completed?: string[] | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          study_id: string
          user_id: string
        }
        Update: {
          chapters_completed?: string[] | null
          completed_at?: string | null
          id?: string
          notes?: string | null
          study_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_progress_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "bible_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          is_approved: boolean | null
          likes_count: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          likes_count?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          is_approved?: boolean | null
          likes_count?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimony_likes: {
        Row: {
          created_at: string
          id: string
          testimony_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          testimony_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          testimony_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimony_likes_testimony_id_fkey"
            columns: ["testimony_id"]
            isOneToOne: false
            referencedRelation: "testimonies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_milestones: {
        Row: {
          id: string
          milestone_id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          milestone_id: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          milestone_id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          completed_at: string
          correct_answers: number
          id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers?: number
          id?: string
          quiz_id: string
          score?: number
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "bible_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reading_progress: {
        Row: {
          completed_at: string | null
          current_day: number
          id: string
          is_active: boolean | null
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean | null
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean | null
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_routine_progress: {
        Row: {
          completed_at: string | null
          current_day: number
          id: string
          is_active: boolean | null
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean | null
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          current_day?: number
          id?: string
          is_active?: boolean | null
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_routine_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "spiritual_routine_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stories: {
        Row: {
          audio_title: string | null
          audio_url: string | null
          background_color: string | null
          comments_count: number | null
          content: string | null
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          likes_count: number | null
          tagged_users: string[] | null
          text_color: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          audio_title?: string | null
          audio_url?: string | null
          background_color?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          expires_at: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          tagged_users?: string[] | null
          text_color?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          audio_title?: string | null
          audio_url?: string | null
          background_color?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number | null
          tagged_users?: string[] | null
          text_color?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      xp_activities: {
        Row: {
          activity_key: string
          created_at: string
          daily_limit: number | null
          description: string | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          xp_value: number
        }
        Insert: {
          activity_key: string
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          xp_value: number
        }
        Update: {
          activity_key?: string
          created_at?: string
          daily_limit?: number | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          xp_value?: number
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          activity_id: string | null
          activity_type: string
          created_at: string
          description: string | null
          id: string
          user_id: string
          xp_amount: number
        }
        Insert: {
          activity_id?: string | null
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          user_id: string
          xp_amount: number
        }
        Update: {
          activity_id?: string | null
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      attendance_scores: {
        Row: {
          attendance_percentage: number | null
          avatar_url: string | null
          events_attended: number | null
          full_name: string | null
          status: string | null
          total_events: number | null
          user_id: string | null
        }
        Relationships: []
      }
      attendance_summary: {
        Row: {
          city: string | null
          full_name: string | null
          last_attendance: string | null
          state: string | null
          total_attendance: number | null
          user_id: string | null
        }
        Relationships: []
      }
      engagement_metrics: {
        Row: {
          city: string | null
          devotionals_completed: number | null
          full_name: string | null
          is_approved: boolean | null
          posts_count: number | null
          prayers_count: number | null
          quizzes_completed: number | null
          state: string | null
          study_chapters_completed: number | null
          testimonies_count: number | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          devotionals_completed?: never
          full_name?: string | null
          is_approved?: boolean | null
          posts_count?: never
          prayers_count?: never
          quizzes_completed?: never
          state?: string | null
          study_chapters_completed?: never
          testimonies_count?: never
          user_id?: string | null
        }
        Update: {
          city?: string | null
          devotionals_completed?: never
          full_name?: string | null
          is_approved?: boolean | null
          posts_count?: never
          prayers_count?: never
          quizzes_completed?: never
          state?: string | null
          study_chapters_completed?: never
          testimonies_count?: never
          user_id?: string | null
        }
        Relationships: []
      }
      member_directory: {
        Row: {
          avatar_url: string | null
          current_level: number | null
          full_name: string | null
          is_approved: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          current_level?: number | null
          full_name?: string | null
          is_approved?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          current_level?: number | null
          full_name?: string | null
          is_approved?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_level: number | null
          full_name: string | null
          last_seen: string | null
          total_xp: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_level?: number | null
          full_name?: string | null
          last_seen?: string | null
          total_xp?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_level?: number | null
          full_name?: string | null
          last_seen?: string | null
          total_xp?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_user_xp: {
        Args: {
          p_activity_id?: string
          p_activity_type: string
          p_description?: string
          p_user_id: string
          p_xp_amount: number
        }
        Returns: {
          level_up: boolean
          new_level: number
          new_total_xp: number
        }[]
      }
      calculate_level_from_xp: { Args: { xp_total: number }; Returns: number }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_leader: { Args: { _user_id: string }; Returns: boolean }
      is_approved_admin_or_leader: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      log_security_audit: {
        Args: {
          p_action_type: string
          p_new_values?: Json
          p_old_values?: Json
          p_target_id?: string
          p_target_table?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "jovem" | "lider" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["jovem", "lider", "admin"],
    },
  },
} as const
