import type { Database, Json } from "@/types/database.generated";

export type { Database, Json };

type PublicSchema = Database["public"];

/** Row type of a table or view: `Tables<"levels">`. */
export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R } ? R : never;

/** Insert payload of a table: `TablesInsert<"srs_cards">`. */
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Insert: infer I } ? I : never;

/** Update payload of a table: `TablesUpdate<"profiles">`. */
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T] extends { Update: infer U } ? U : never;

/** A Postgres enum: `Enums<"srs_rating">`. */
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
