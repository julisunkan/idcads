import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  cards, settings, templates, 
  type Card, type InsertCard, type Settings, type InsertSettings 
} from "@shared/schema";

export interface IStorage {
  // Cards
  createCard(card: InsertCard): Promise<Card>;
  getCards(): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  getCardByIdNumber(idNumber: string): Promise<Card | undefined>;
  updateCardStatus(id: number, status: string): Promise<Card | undefined>;
  updateCardAssets(id: number, assets: { qrCodeUrl: string, generatedImageUrl: string, generatedPdfUrl: string }): Promise<Card | undefined>;
  
  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async createCard(cardData: InsertCard): Promise<Card> {
    const [card] = await db.insert(cards).values(cardData).returning();
    return card;
  }

  async getCards(): Promise<Card[]> {
    return await db.select().from(cards).orderBy(desc(cards.createdAt));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card;
  }

  async getCardByIdNumber(idNumber: string): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.idNumber, idNumber));
    return card;
  }

  async updateCardStatus(id: number, status: string): Promise<Card | undefined> {
    const [card] = await db
      .update(cards)
      .set({ status })
      .where(eq(cards.id, id))
      .returning();
    return card;
  }

  async updateCardAssets(id: number, assets: { qrCodeUrl: string, generatedImageUrl: string, generatedPdfUrl: string }): Promise<Card | undefined> {
    const [card] = await db
      .update(cards)
      .set(assets)
      .where(eq(cards.id, id))
      .returning();
    return card;
  }

  async getSettings(): Promise<Settings> {
    const [existing] = await db.select().from(settings).limit(1);
    if (existing) return existing;
    
    // Create default settings if none exist
    const [newSettings] = await db.insert(settings).values({}).returning();
    return newSettings;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings> {
    const current = await this.getSettings();
    const [updated] = await db
      .update(settings)
      .set(updates)
      .where(eq(settings.id, current.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
