import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { generateAssets } from "./lib/generator";
import { z } from "zod";
import express from "express";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Cards API
  
  // Create Card (Public for MVP, or Protected? Requirement says "Admin can... View all", but "User inputs..." implies public or user facing. I'll make it public for generation, Admin for managing)
  app.post(api.cards.create.path, async (req, res) => {
    try {
      const input = api.cards.create.input.parse(req.body);
      
      // Check for uniqueness if db doesn't handle it gracefully (it has unique constraint)
      const existing = await storage.getCardByIdNumber(input.idNumber);
      if (existing) {
        return res.status(400).json({ message: "ID Number already exists" });
      }

      // Create initial record
      let card = await storage.createCard(input);

      // Generate Assets
      const settings = await storage.getSettings();
      const assets = await generateAssets(card, settings);

      // Update card with assets
      card = (await storage.updateCardAssets(card.id, assets))!;

      res.status(201).json(card);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      // Handle db unique constraint error generically if missed above
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // List Cards (Admin Only)
  app.get(api.cards.list.path, isAuthenticated, async (req, res) => {
    const cards = await storage.getCards();
    res.json(cards);
  });

  // Get Card (Admin Only)
  app.get(api.cards.get.path, isAuthenticated, async (req, res) => {
    const card = await storage.getCard(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  // Update Status (Admin Only)
  app.patch(api.cards.updateStatus.path, isAuthenticated, async (req, res) => {
    const { status } = req.body;
    const card = await storage.updateCardStatus(Number(req.params.id), status);
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  // Verify Card (Public)
  app.get(api.cards.verify.path, async (req, res) => {
    const card = await storage.getCardByIdNumber(req.params.idNumber);
    if (!card) return res.status(404).json({ message: "Card not found" });
    
    // Return only public info
    res.json({
      fullName: card.fullName,
      country: card.country,
      status: card.status,
      idNumber: card.idNumber
    });
  });

  // Settings (Admin Only)
  app.get(api.settings.get.path, isAuthenticated, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, isAuthenticated, async (req, res) => {
    const settings = await storage.updateSettings(req.body);
    res.json(settings);
  });

  return httpServer;
}
