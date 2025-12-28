import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Export Auth Models
export * from "./models/auth";

// === TABLE DEFINITIONS ===

// ID Cards
export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  dob: text("dob").notNull(), // stored as string for simplicity or timestamp
  idNumber: text("id_number").notNull().unique(),
  country: text("country").notNull(),
  theme: text("theme").notNull(), // 'blue', 'green', 'gold'
  photoUrl: text("photo_url"), // Uploaded photo path
  signatureUrl: text("signature_url"), // Signature from signature pad
  qrCodeUrl: text("qr_code_url"), // Generated QR code path
  status: text("status").notNull().default("VALID"), // VALID, REVOKED, EXPIRED
  createdAt: timestamp("created_at").defaultNow(),
  generatedImageUrl: text("generated_image_url"),
  generatedPdfUrl: text("generated_pdf_url"),
});

// Admin Settings (Watermark)
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  watermarkText: text("watermark_text").default("UNITED STATES"),
  watermarkColor: text("watermark_color").default("#000000"),
  watermarkOpacity: integer("watermark_opacity").default(50), // 0-100
  watermarkPosition: text("watermark_position").default("center"), // top, center, bottom
  watermarkEnabled: boolean("watermark_enabled").default(true),
});

// Card Templates (Optional advanced feature, simple structure for now)
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  config: jsonb("config").notNull(), // JSON storage for layout coordinates
});

// === SCHEMAS ===

export const insertCardSchema = createInsertSchema(cards).omit({ 
  id: true, 
  createdAt: true, 
  status: true,
  qrCodeUrl: true, 
  generatedImageUrl: true, 
  generatedPdfUrl: true 
}).extend({
  photoUrl: z.string().optional(),
  signatureUrl: z.string().optional(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });

// === TYPES ===

export type Card = typeof cards.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

// === API TYPES ===

export type CreateCardRequest = InsertCard;
export type UpdateCardStatusRequest = { status: 'VALID' | 'REVOKED' | 'EXPIRED' };
export type UpdateSettingsRequest = Partial<InsertSettings>;
export type VerifyCardResponse = Pick<Card, "fullName" | "country" | "status" | "idNumber">;
