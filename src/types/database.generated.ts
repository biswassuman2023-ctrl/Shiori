export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessment_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean | null
          latency_ms: number | null
          position: number
          question_id: string
          response: Json
          user_id: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          latency_ms?: number | null
          position: number
          question_id: string
          response?: Json
          user_id: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          latency_ms?: number | null
          position?: number
          question_id?: string
          response?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["assessment_kind"]
          score: number | null
          started_at: string
          state: Json
          status: Database["public"]["Enums"]["assessment_attempt_status"]
          test_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["assessment_kind"]
          score?: number | null
          started_at?: string
          state?: Json
          status?: Database["public"]["Enums"]["assessment_attempt_status"]
          test_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["assessment_kind"]
          score?: number | null
          started_at?: string
          state?: Json
          status?: Database["public"]["Enums"]["assessment_attempt_status"]
          test_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "assessment_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_questions: {
        Row: {
          position: number
          question_id: string
          test_id: string
        }
        Insert: {
          position: number
          question_id: string
          test_id: string
        }
        Update: {
          position?: number
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "assessment_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_tests: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          is_adaptive: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_adaptive?: boolean
          kind: Database["public"]["Enums"]["assessment_kind"]
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_adaptive?: boolean
          kind?: Database["public"]["Enums"]["assessment_kind"]
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          created_at: string
          id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          slug: string
          source_id: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          slug: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          slug?: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          attribution_required: boolean
          attribution_text: string | null
          created_at: string
          id: string
          license: string
          license_url: string | null
          name: string
          notes: string | null
          slug: string
          updated_at: string
          url: string | null
        }
        Insert: {
          attribution_required?: boolean
          attribution_text?: string | null
          created_at?: string
          id?: string
          license: string
          license_url?: string | null
          name: string
          notes?: string | null
          slug: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          attribution_required?: boolean
          attribution_text?: string | null
          created_at?: string
          id?: string
          license?: string
          license_url?: string | null
          name?: string
          notes?: string | null
          slug?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      grammar_examples: {
        Row: {
          audio_asset_id: string | null
          english: string
          furigana: Json | null
          grammar_item_id: string
          id: string
          japanese: string
          position: number
          source_id: string | null
        }
        Insert: {
          audio_asset_id?: string | null
          english: string
          furigana?: Json | null
          grammar_item_id: string
          id?: string
          japanese: string
          position: number
          source_id?: string | null
        }
        Update: {
          audio_asset_id?: string | null
          english?: string
          furigana?: Json | null
          grammar_item_id?: string
          id?: string
          japanese?: string
          position?: number
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grammar_examples_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_examples_grammar_item_id_fkey"
            columns: ["grammar_item_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "grammar_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      grammar_points: {
        Row: {
          explanation: Json
          formation: string[]
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes: string | null
          pattern: string
          register: string | null
          title: string
        }
        Insert: {
          explanation?: Json
          formation?: string[]
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          pattern: string
          register?: string | null
          title: string
        }
        Update: {
          explanation?: Json
          formation?: string[]
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          pattern?: string
          register?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_points_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grammar_points_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
        ]
      }
      grammar_relations: {
        Row: {
          from_item_id: string
          id: string
          note: string | null
          relation: string
          to_item_id: string
        }
        Insert: {
          from_item_id: string
          id?: string
          note?: string | null
          relation: string
          to_item_id: string
        }
        Update: {
          from_item_id?: string
          id?: string
          note?: string | null
          relation?: string
          to_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grammar_relations_from_item_id_fkey"
            columns: ["from_item_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "grammar_relations_to_item_id_fkey"
            columns: ["to_item_id"]
            isOneToOne: false
            referencedRelation: "grammar_points"
            referencedColumns: ["item_id"]
          },
        ]
      }
      kana: {
        Row: {
          audio_asset_id: string | null
          base_item_id: string | null
          character: string
          gojuon_column: string
          gojuon_row: string
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          mnemonic: string | null
          romaji: string
          script: string
          stroke_count: number | null
          stroke_order_asset_id: string | null
          variant: string
        }
        Insert: {
          audio_asset_id?: string | null
          base_item_id?: string | null
          character: string
          gojuon_column: string
          gojuon_row: string
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          mnemonic?: string | null
          romaji: string
          script: string
          stroke_count?: number | null
          stroke_order_asset_id?: string | null
          variant?: string
        }
        Update: {
          audio_asset_id?: string | null
          base_item_id?: string | null
          character?: string
          gojuon_column?: string
          gojuon_row?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          mnemonic?: string | null
          romaji?: string
          script?: string
          stroke_count?: number | null
          stroke_order_asset_id?: string | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "kana_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kana_base_item_id_fkey"
            columns: ["base_item_id"]
            isOneToOne: false
            referencedRelation: "kana"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "kana_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kana_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
          {
            foreignKeyName: "kana_stroke_order_asset_id_fkey"
            columns: ["stroke_order_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji: {
        Row: {
          character: string
          frequency_rank: number | null
          grade: number | null
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          kun_readings: string[]
          meanings: string[]
          mnemonic: string | null
          nanori_readings: string[]
          notes: string | null
          on_readings: string[]
          radical_character: string | null
          radical_number: number | null
          stroke_count: number | null
          stroke_order_asset_id: string | null
        }
        Insert: {
          character: string
          frequency_rank?: number | null
          grade?: number | null
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          kun_readings?: string[]
          meanings?: string[]
          mnemonic?: string | null
          nanori_readings?: string[]
          notes?: string | null
          on_readings?: string[]
          radical_character?: string | null
          radical_number?: number | null
          stroke_count?: number | null
          stroke_order_asset_id?: string | null
        }
        Update: {
          character?: string
          frequency_rank?: number | null
          grade?: number | null
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          kun_readings?: string[]
          meanings?: string[]
          mnemonic?: string | null
          nanori_readings?: string[]
          notes?: string | null
          on_readings?: string[]
          radical_character?: string | null
          radical_number?: number | null
          stroke_count?: number | null
          stroke_order_asset_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanji_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanji_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
          {
            foreignKeyName: "kanji_stroke_order_asset_id_fkey"
            columns: ["stroke_order_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      kanji_components: {
        Row: {
          component_character: string
          component_kanji_item_id: string | null
          component_meaning: string | null
          id: string
          kanji_item_id: string
          position: number
          role: string
        }
        Insert: {
          component_character: string
          component_kanji_item_id?: string | null
          component_meaning?: string | null
          id?: string
          kanji_item_id: string
          position: number
          role?: string
        }
        Update: {
          component_character?: string
          component_kanji_item_id?: string | null
          component_meaning?: string | null
          id?: string
          kanji_item_id?: string
          position?: number
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "kanji_components_component_kanji_item_id_fkey"
            columns: ["component_kanji_item_id"]
            isOneToOne: false
            referencedRelation: "kanji"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "kanji_components_kanji_item_id_fkey"
            columns: ["kanji_item_id"]
            isOneToOne: false
            referencedRelation: "kanji"
            referencedColumns: ["item_id"]
          },
        ]
      }
      lesson_content: {
        Row: {
          block_type: Database["public"]["Enums"]["lesson_block_type"]
          created_at: string
          id: string
          is_required: boolean
          lesson_id: string
          position: number
          props: Json
          question_id: string | null
          updated_at: string
        }
        Insert: {
          block_type: Database["public"]["Enums"]["lesson_block_type"]
          created_at?: string
          id?: string
          is_required?: boolean
          lesson_id: string
          position: number
          props?: Json
          question_id?: string | null
          updated_at?: string
        }
        Update: {
          block_type?: Database["public"]["Enums"]["lesson_block_type"]
          created_at?: string
          id?: string
          is_required?: boolean
          lesson_id?: string
          position?: number
          props?: Json
          question_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_content_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_content_items: {
        Row: {
          block_id: string
          item_id: string
          position: number
        }
        Insert: {
          block_id: string
          item_id: string
          position: number
        }
        Update: {
          block_id?: string
          item_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_items_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "lesson_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_content_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          estimated_minutes: number | null
          id: string
          position: number
          primary_skill: Database["public"]["Enums"]["skill_type"]
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          subtitle: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          position: number
          primary_skill: Database["public"]["Enums"]["skill_type"]
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          subtitle?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number | null
          id?: string
          position?: number
          primary_skill?: Database["public"]["Enums"]["skill_type"]
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          subtitle?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          code: Database["public"]["Enums"]["curriculum_level_code"]
          created_at: string
          description: string | null
          id: string
          position: number
          status: Database["public"]["Enums"]["publication_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code: Database["public"]["Enums"]["curriculum_level_code"]
          created_at?: string
          description?: string | null
          id?: string
          position: number
          status?: Database["public"]["Enums"]["publication_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          code?: Database["public"]["Enums"]["curriculum_level_code"]
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          status?: Database["public"]["Enums"]["publication_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      listening_lessons: {
        Row: {
          audio_asset_id: string
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes: string | null
          speakers: Json
          title: string
        }
        Insert: {
          audio_asset_id: string
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          speakers?: Json
          title: string
        }
        Update: {
          audio_asset_id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          speakers?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_lessons_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_lessons_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listening_lessons_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
        ]
      }
      listening_segments: {
        Row: {
          end_ms: number
          furigana: Json | null
          id: string
          listening_item_id: string
          position: number
          speaker_id: string | null
          start_ms: number
          transcript_en: string | null
          transcript_ja: string
        }
        Insert: {
          end_ms: number
          furigana?: Json | null
          id?: string
          listening_item_id: string
          position: number
          speaker_id?: string | null
          start_ms: number
          transcript_en?: string | null
          transcript_ja: string
        }
        Update: {
          end_ms?: number
          furigana?: Json | null
          id?: string
          listening_item_id?: string
          position?: number
          speaker_id?: string | null
          start_ms?: number
          transcript_en?: string | null
          transcript_ja?: string
        }
        Relationships: [
          {
            foreignKeyName: "listening_segments_listening_item_id_fkey"
            columns: ["listening_item_id"]
            isOneToOne: false
            referencedRelation: "listening_lessons"
            referencedColumns: ["item_id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket_id: string
          byte_size: number | null
          created_at: string
          duration_ms: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          metadata: Json
          mime_type: string
          source_id: string | null
          storage_path: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          byte_size?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          metadata?: Json
          mime_type: string
          source_id?: string | null
          storage_path: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          byte_size?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          metadata?: Json
          mime_type?: string
          source_id?: string | null
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      placement_results: {
        Row: {
          accepted_at: string | null
          attempt_id: string | null
          confidence: number
          created_at: string
          id: string
          placed_lesson_id: string | null
          placed_level_code: Database["public"]["Enums"]["curriculum_level_code"]
          placed_unit_id: string | null
          rationale: Json
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          attempt_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          placed_lesson_id?: string | null
          placed_level_code: Database["public"]["Enums"]["curriculum_level_code"]
          placed_unit_id?: string | null
          rationale?: Json
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          attempt_id?: string | null
          confidence?: number
          created_at?: string
          id?: string
          placed_lesson_id?: string | null
          placed_level_code?: Database["public"]["Enums"]["curriculum_level_code"]
          placed_unit_id?: string | null
          rationale?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "assessment_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_results_placed_lesson_id_fkey"
            columns: ["placed_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_results_placed_unit_id_fkey"
            columns: ["placed_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_lesson_id: string | null
          current_level_code:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          daily_goal_minutes: number
          day_start_hour: number
          display_name: string | null
          id: string
          onboarding_completed_at: string | null
          placement_completed_at: string | null
          timezone: string
          ui_locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_lesson_id?: string | null
          current_level_code?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          daily_goal_minutes?: number
          day_start_hour?: number
          display_name?: string | null
          id: string
          onboarding_completed_at?: string | null
          placement_completed_at?: string | null
          timezone?: string
          ui_locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_lesson_id?: string | null
          current_level_code?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          daily_goal_minutes?: number
          day_start_hour?: number
          display_name?: string | null
          id?: string
          onboarding_completed_at?: string | null
          placement_completed_at?: string | null
          timezone?: string
          ui_locale?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_lesson_id_fkey"
            columns: ["current_lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          content: Json
          id: string
          is_correct: boolean
          match_key: string | null
          position: number
          question_id: string
        }
        Insert: {
          content?: Json
          id?: string
          is_correct?: boolean
          match_key?: string | null
          position: number
          question_id: string
        }
        Update: {
          content?: Json
          id?: string
          is_correct?: boolean
          match_key?: string | null
          position?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          created_at: string
          difficulty: number
          explanation: Json | null
          id: string
          is_gated: boolean
          item_direction: Database["public"]["Enums"]["srs_direction"] | null
          item_id: string | null
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          prompt: Json
          question_type: Database["public"]["Enums"]["question_type"]
          skill: Database["public"]["Enums"]["skill_type"]
          source_id: string | null
          status: Database["public"]["Enums"]["publication_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          difficulty?: number
          explanation?: Json | null
          id?: string
          is_gated?: boolean
          item_direction?: Database["public"]["Enums"]["srs_direction"] | null
          item_id?: string | null
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          prompt?: Json
          question_type: Database["public"]["Enums"]["question_type"]
          skill: Database["public"]["Enums"]["skill_type"]
          source_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          difficulty?: number
          explanation?: Json | null
          id?: string
          is_gated?: boolean
          item_direction?: Database["public"]["Enums"]["srs_direction"] | null
          item_id?: string | null
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          prompt?: Json
          question_type?: Database["public"]["Enums"]["question_type"]
          skill?: Database["public"]["Enums"]["skill_type"]
          source_id?: string | null
          status?: Database["public"]["Enums"]["publication_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_passages: {
        Row: {
          audio_asset_id: string | null
          estimated_seconds: number | null
          genre: string | null
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes: string | null
          title: string
        }
        Insert: {
          audio_asset_id?: string | null
          estimated_seconds?: number | null
          genre?: string | null
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          title: string
        }
        Update: {
          audio_asset_id?: string | null
          estimated_seconds?: number | null
          genre?: string | null
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          notes?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_passages_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_passages_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_passages_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
        ]
      }
      reading_sentences: {
        Row: {
          audio_asset_id: string | null
          english: string | null
          furigana: Json | null
          id: string
          japanese: string
          paragraph: number
          passage_item_id: string
          position: number
        }
        Insert: {
          audio_asset_id?: string | null
          english?: string | null
          furigana?: Json | null
          id?: string
          japanese: string
          paragraph?: number
          passage_item_id: string
          position: number
        }
        Update: {
          audio_asset_id?: string | null
          english?: string | null
          furigana?: Json | null
          id?: string
          japanese?: string
          paragraph?: number
          passage_item_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "reading_sentences_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_sentences_passage_item_id_fkey"
            columns: ["passage_item_id"]
            isOneToOne: false
            referencedRelation: "reading_passages"
            referencedColumns: ["item_id"]
          },
        ]
      }
      srs_cards: {
        Row: {
          created_at: string
          direction: Database["public"]["Enums"]["srs_direction"]
          due_at: string
          id: string
          interval_days: number
          item_id: string
          lapses: number
          last_reviewed_at: string | null
          reps: number
          scheduler: string
          scheduler_state: Json
          state: Database["public"]["Enums"]["srs_card_state"]
          suspended_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: Database["public"]["Enums"]["srs_direction"]
          due_at?: string
          id?: string
          interval_days?: number
          item_id: string
          lapses?: number
          last_reviewed_at?: string | null
          reps?: number
          scheduler?: string
          scheduler_state?: Json
          state?: Database["public"]["Enums"]["srs_card_state"]
          suspended_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: Database["public"]["Enums"]["srs_direction"]
          due_at?: string
          id?: string
          interval_days?: number
          item_id?: string
          lapses?: number
          last_reviewed_at?: string | null
          reps?: number
          scheduler?: string
          scheduler_state?: Json
          state?: Database["public"]["Enums"]["srs_card_state"]
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_cards_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_reviews: {
        Row: {
          card_id: string
          context: string
          elapsed_days: number | null
          id: string
          interval_after: number
          interval_before: number
          latency_ms: number | null
          rating: Database["public"]["Enums"]["srs_rating"]
          reviewed_at: string
          state_before: Database["public"]["Enums"]["srs_card_state"]
          user_id: string
        }
        Insert: {
          card_id: string
          context?: string
          elapsed_days?: number | null
          id?: string
          interval_after: number
          interval_before: number
          latency_ms?: number | null
          rating: Database["public"]["Enums"]["srs_rating"]
          reviewed_at?: string
          state_before: Database["public"]["Enums"]["srs_card_state"]
          user_id: string
        }
        Update: {
          card_id?: string
          context?: string
          elapsed_days?: number | null
          id?: string
          interval_after?: number
          interval_before?: number
          latency_ms?: number | null
          rating?: Database["public"]["Enums"]["srs_rating"]
          reviewed_at?: string
          state_before?: Database["public"]["Enums"]["srs_card_state"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "srs_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "srs_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_id: string
          position: number
          slug: string
          status: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_id: string
          position: number
          slug: string
          status?: Database["public"]["Enums"]["publication_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_id?: string
          position?: number
          slug?: string
          status?: Database["public"]["Enums"]["publication_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_curriculum_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          progress_state: Json
          score: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          progress_state?: Json
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          progress_state?: Json
          score?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          created_at: string
          first_seen_at: string | null
          id: string
          item_id: string
          last_seen_at: string | null
          strength: number
          times_correct: number
          times_seen: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_seen_at?: string | null
          id?: string
          item_id: string
          last_seen_at?: string | null
          strength?: number
          times_correct?: number
          times_seen?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_seen_at?: string | null
          id?: string
          item_id?: string
          last_seen_at?: string | null
          strength?: number
          times_correct?: number
          times_seen?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_skill_mastery: {
        Row: {
          confidence: number
          created_at: string
          evidence_count: number
          id: string
          last_evaluated_at: string | null
          level_code: Database["public"]["Enums"]["curriculum_level_code"]
          mastery: number
          skill: Database["public"]["Enums"]["skill_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          evidence_count?: number
          id?: string
          last_evaluated_at?: string | null
          level_code: Database["public"]["Enums"]["curriculum_level_code"]
          mastery?: number
          skill: Database["public"]["Enums"]["skill_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          created_at?: string
          evidence_count?: number
          id?: string
          last_evaluated_at?: string | null
          level_code?: Database["public"]["Enums"]["curriculum_level_code"]
          mastery?: number
          skill?: Database["public"]["Enums"]["skill_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocabulary: {
        Row: {
          audio_asset_id: string | null
          frequency_rank: number | null
          furigana: Json | null
          is_common: boolean
          item_id: string
          item_type: Database["public"]["Enums"]["content_item_type"]
          jlpt_level:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          meaning: string
          notes: string | null
          part_of_speech: string[]
          pitch_accent: number[] | null
          reading: string
          senses: Json
          written: string
        }
        Insert: {
          audio_asset_id?: string | null
          frequency_rank?: number | null
          furigana?: Json | null
          is_common?: boolean
          item_id: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          meaning: string
          notes?: string | null
          part_of_speech?: string[]
          pitch_accent?: number[] | null
          reading: string
          senses?: Json
          written: string
        }
        Update: {
          audio_asset_id?: string | null
          frequency_rank?: number | null
          furigana?: Json | null
          is_common?: boolean
          item_id?: string
          item_type?: Database["public"]["Enums"]["content_item_type"]
          jlpt_level?:
            | Database["public"]["Enums"]["curriculum_level_code"]
            | null
          meaning?: string
          notes?: string | null
          part_of_speech?: string[]
          pitch_accent?: number[] | null
          reading?: string
          senses?: Json
          written?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_item_id_item_type_fkey"
            columns: ["item_id", "item_type"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id", "item_type"]
          },
        ]
      }
      vocabulary_examples: {
        Row: {
          audio_asset_id: string | null
          created_at: string
          english: string
          furigana: Json | null
          id: string
          japanese: string
          position: number
          source_id: string | null
          vocabulary_item_id: string
        }
        Insert: {
          audio_asset_id?: string | null
          created_at?: string
          english: string
          furigana?: Json | null
          id?: string
          japanese: string
          position: number
          source_id?: string | null
          vocabulary_item_id: string
        }
        Update: {
          audio_asset_id?: string | null
          created_at?: string
          english?: string
          furigana?: Json | null
          id?: string
          japanese?: string
          position?: number
          source_id?: string | null
          vocabulary_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_examples_audio_asset_id_fkey"
            columns: ["audio_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "content_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vocabulary_examples_vocabulary_item_id_fkey"
            columns: ["vocabulary_item_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["item_id"]
          },
        ]
      }
      vocabulary_kanji: {
        Row: {
          kanji_item_id: string
          position: number
          vocabulary_item_id: string
        }
        Insert: {
          kanji_item_id: string
          position: number
          vocabulary_item_id: string
        }
        Update: {
          kanji_item_id?: string
          position?: number
          vocabulary_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vocabulary_kanji_kanji_item_id_fkey"
            columns: ["kanji_item_id"]
            isOneToOne: false
            referencedRelation: "kanji"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "vocabulary_kanji_vocabulary_item_id_fkey"
            columns: ["vocabulary_item_id"]
            isOneToOne: false
            referencedRelation: "vocabulary"
            referencedColumns: ["item_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
    }
    Enums: {
      assessment_attempt_status: "in_progress" | "completed" | "abandoned"
      assessment_kind: "placement" | "diagnostic" | "unit_check" | "level_test"
      content_item_type:
        | "kana"
        | "vocabulary"
        | "kanji"
        | "grammar"
        | "reading"
        | "listening"
      curriculum_level_code:
        | "hiragana"
        | "katakana"
        | "n5"
        | "n4"
        | "n3"
        | "n2"
        | "n1"
      lesson_block_type:
        | "prose"
        | "kana"
        | "vocabulary"
        | "kanji"
        | "grammar"
        | "reading"
        | "listening"
        | "question"
      lesson_progress_status: "not_started" | "in_progress" | "completed"
      media_kind: "audio" | "image" | "svg" | "video"
      publication_status: "draft" | "in_review" | "published" | "archived"
      question_type:
        | "multiple_choice"
        | "text_input"
        | "audio_choice"
        | "matching"
        | "ordering"
      skill_type:
        | "hiragana"
        | "katakana"
        | "vocabulary"
        | "kanji"
        | "grammar"
        | "reading"
        | "listening"
      srs_card_state: "new" | "learning" | "review" | "relearning" | "suspended"
      srs_direction: "recognition" | "recall" | "listening"
      srs_rating: "again" | "hard" | "good" | "easy"
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
      assessment_attempt_status: ["in_progress", "completed", "abandoned"],
      assessment_kind: ["placement", "diagnostic", "unit_check", "level_test"],
      content_item_type: [
        "kana",
        "vocabulary",
        "kanji",
        "grammar",
        "reading",
        "listening",
      ],
      curriculum_level_code: [
        "hiragana",
        "katakana",
        "n5",
        "n4",
        "n3",
        "n2",
        "n1",
      ],
      lesson_block_type: [
        "prose",
        "kana",
        "vocabulary",
        "kanji",
        "grammar",
        "reading",
        "listening",
        "question",
      ],
      lesson_progress_status: ["not_started", "in_progress", "completed"],
      media_kind: ["audio", "image", "svg", "video"],
      publication_status: ["draft", "in_review", "published", "archived"],
      question_type: [
        "multiple_choice",
        "text_input",
        "audio_choice",
        "matching",
        "ordering",
      ],
      skill_type: [
        "hiragana",
        "katakana",
        "vocabulary",
        "kanji",
        "grammar",
        "reading",
        "listening",
      ],
      srs_card_state: ["new", "learning", "review", "relearning", "suspended"],
      srs_direction: ["recognition", "recall", "listening"],
      srs_rating: ["again", "hard", "good", "easy"],
    },
  },
} as const

