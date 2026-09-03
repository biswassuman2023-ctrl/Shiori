/**
 * INTERIM STAND-IN — NOT THE OUTPUT OF `supabase gen types`.
 *
 * Docker is unavailable in this environment, so `npm run db:types` has never
 * been run against a real Postgres instance. This file is hand-authored to
 * match the migrations in `supabase/migrations/` as of the Hiragana vertical
 * slice, so that the query code in `src/services/` and `src/lib/lesson-progress/`
 * typechecks meaningfully in the meantime.
 *
 * It is DELIBERATELY PARTIAL: it covers only the tables that slice's code
 * actually queries (levels, units, lessons, lesson_content,
 * lesson_content_items, kana, media_assets, questions, question_options,
 * user_curriculum_progress, srs_cards), not the full schema. Every other
 * table (profiles, vocabulary, grammar_points, srs_reviews, ...) is absent —
 * code that queries them will not typecheck against this file, on purpose,
 * so nothing accidentally relies on a shape nobody has verified.
 *
 * The moment Docker is available:
 *
 *     npm run db:start
 *     npm run db:reset
 *     npm run db:types
 *
 * `db:types` OVERWRITES this file wholesale with the real, complete output.
 * Do not hand-edit table shapes here beyond what's needed to keep this
 * interim file honest about the current migrations — the goal is a smooth
 * replacement, not a file worth preserving.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      levels: {
        Row: {
          id: string;
          code: Database["public"]["Enums"]["curriculum_level_code"];
          title: string;
          subtitle: string | null;
          description: string | null;
          position: number;
          status: Database["public"]["Enums"]["publication_status"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["levels"]["Row"]> & {
          code: Database["public"]["Enums"]["curriculum_level_code"];
          title: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["levels"]["Row"]>;
        Relationships: [];
      };
      units: {
        Row: {
          id: string;
          level_id: string;
          slug: string;
          title: string;
          description: string | null;
          position: number;
          status: Database["public"]["Enums"]["publication_status"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["units"]["Row"]> & {
          level_id: string;
          slug: string;
          title: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Row"]>;
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          unit_id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          position: number;
          estimated_minutes: number | null;
          primary_skill: Database["public"]["Enums"]["skill_type"];
          status: Database["public"]["Enums"]["publication_status"];
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]> & {
          unit_id: string;
          slug: string;
          title: string;
          position: number;
          primary_skill: Database["public"]["Enums"]["skill_type"];
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Relationships: [];
      };
      lesson_content: {
        Row: {
          id: string;
          lesson_id: string;
          position: number;
          block_type: Database["public"]["Enums"]["lesson_block_type"];
          props: Json;
          question_id: string | null;
          is_required: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["lesson_content"]["Row"]> & {
          lesson_id: string;
          position: number;
          block_type: Database["public"]["Enums"]["lesson_block_type"];
        };
        Update: Partial<Database["public"]["Tables"]["lesson_content"]["Row"]>;
        Relationships: [];
      };
      lesson_content_items: {
        Row: {
          block_id: string;
          item_id: string;
          position: number;
        };
        Insert: Database["public"]["Tables"]["lesson_content_items"]["Row"];
        Update: Partial<Database["public"]["Tables"]["lesson_content_items"]["Row"]>;
        Relationships: [];
      };
      kana: {
        Row: {
          item_id: string;
          item_type: "kana";
          character: string;
          script: string;
          romaji: string;
          gojuon_row: string;
          gojuon_column: string;
          base_item_id: string | null;
          variant: string;
          stroke_count: number | null;
          stroke_order_asset_id: string | null;
          audio_asset_id: string | null;
          mnemonic: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["kana"]["Row"]> & {
          item_id: string;
          character: string;
          script: string;
          romaji: string;
          gojuon_row: string;
          gojuon_column: string;
        };
        Update: Partial<Database["public"]["Tables"]["kana"]["Row"]>;
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          kind: Database["public"]["Enums"]["media_kind"];
          bucket_id: string;
          storage_path: string;
          mime_type: string;
          byte_size: number | null;
          duration_ms: number | null;
          metadata: Json;
          source_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["media_assets"]["Row"]> & {
          kind: Database["public"]["Enums"]["media_kind"];
          bucket_id: string;
          storage_path: string;
          mime_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Row"]>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          question_type: Database["public"]["Enums"]["question_type"];
          skill: Database["public"]["Enums"]["skill_type"];
          prompt: Json;
          explanation: Json | null;
          item_id: string | null;
          item_direction: Database["public"]["Enums"]["srs_direction"] | null;
          difficulty: number;
          jlpt_level: Database["public"]["Enums"]["curriculum_level_code"] | null;
          status: Database["public"]["Enums"]["publication_status"];
          is_gated: boolean;
          source_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["questions"]["Row"]> & {
          question_type: Database["public"]["Enums"]["question_type"];
          skill: Database["public"]["Enums"]["skill_type"];
        };
        Update: Partial<Database["public"]["Tables"]["questions"]["Row"]>;
        Relationships: [];
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          position: number;
          content: Json;
          is_correct: boolean;
          match_key: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["question_options"]["Row"]> & {
          question_id: string;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["question_options"]["Row"]>;
        Relationships: [];
      };
      user_curriculum_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          status: Database["public"]["Enums"]["lesson_progress_status"];
          score: number | null;
          attempts: number;
          progress_state: Json;
          started_at: Timestamp | null;
          completed_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["user_curriculum_progress"]["Row"]> & {
          user_id: string;
          lesson_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_curriculum_progress"]["Row"]>;
        Relationships: [];
      };
      srs_cards: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          direction: Database["public"]["Enums"]["srs_direction"];
          state: Database["public"]["Enums"]["srs_card_state"];
          due_at: Timestamp;
          interval_days: number;
          reps: number;
          lapses: number;
          last_reviewed_at: Timestamp | null;
          scheduler_state: Json;
          scheduler: string;
          suspended_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]> & {
          user_id: string;
          item_id: string;
          direction: Database["public"]["Enums"]["srs_direction"];
        };
        Update: Partial<Database["public"]["Tables"]["srs_cards"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      curriculum_level_code: "hiragana" | "katakana" | "n5" | "n4" | "n3" | "n2" | "n1";
      skill_type:
        | "hiragana"
        | "katakana"
        | "vocabulary"
        | "kanji"
        | "grammar"
        | "reading"
        | "listening";
      lesson_block_type:
        | "prose"
        | "kana"
        | "vocabulary"
        | "kanji"
        | "grammar"
        | "reading"
        | "listening"
        | "question";
      question_type: "multiple_choice" | "text_input" | "audio_choice" | "matching" | "ordering";
      publication_status: "draft" | "in_review" | "published" | "archived";
      media_kind: "audio" | "image" | "svg" | "video";
      srs_direction: "recognition" | "recall" | "listening";
      srs_card_state: "new" | "learning" | "review" | "relearning" | "suspended";
      lesson_progress_status: "not_started" | "in_progress" | "completed";
    };
    CompositeTypes: Record<never, never>;
  };
};
