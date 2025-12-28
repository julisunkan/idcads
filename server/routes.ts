import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { generateAssets } from "./lib/generator";
import { validateAndSanitize, containsSuspiciousPatterns } from "./lib/validation";
import { z } from "zod";
import express from "express";
import path from "path";
import multer from "multer";
import fs from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Configure multer for file uploads
  const photosDir = path.join(uploadsDir, 'photos');
  if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, photosDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max (reduced for security)
    fileFilter: (req, file, cb) => {
      // Validate MIME type
      const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimes.includes(file.mimetype)) {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'));
        return;
      }
      
      // Validate file extension
      const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
      if (!allowed.test(path.extname(file.originalname))) {
        cb(new Error('Invalid file extension'));
        return;
      }
      
      // Validate filename doesn't contain suspicious characters
      const filename = path.basename(file.originalname);
      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        cb(new Error('Filename contains invalid characters'));
        return;
      }
      
      cb(null, true);
    },
  });

  // Upload middleware that accepts any single file field
  const uploadAny = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, photosDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
      // Validate MIME type
      const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validMimes.includes(file.mimetype)) {
        cb(new Error('Invalid file type'));
        return;
      }
      
      // Validate file extension
      const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
      if (!allowed.test(path.extname(file.originalname))) {
        cb(new Error('Invalid file extension'));
        return;
      }
      
      // Validate filename
      const filename = path.basename(file.originalname);
      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        cb(new Error('Filename invalid'));
        return;
      }
      
      cb(null, true);
    },
  }).any();

  // Setup Auth (Removed as per requirements)

  // Cards API
  
  // Create Card (Public)
  app.post(api.cards.create.path, async (req, res) => {
    try {
      // Check for SQL injection attempts
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string' && containsSuspiciousPatterns(value)) {
          return res.status(400).json({ message: "Invalid input detected. Special characters not allowed." });
        }
      }

      const input = api.cards.create.input.parse(req.body);
      
      // Check for uniqueness
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
      // console.error('Card creation error:', err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // List Cards (Admin Only)
  app.get(api.cards.list.path, async (req, res) => {
    const cards = await storage.getCards();
    res.json(cards);
  });

  // Get Card (Admin Only)
  app.get(api.cards.get.path, async (req, res) => {
    const card = await storage.getCard(Number(req.params.id));
    if (!card) return res.status(404).json({ message: "Card not found" });
    res.json(card);
  });

  // Update Status (Admin Only)
  app.patch(api.cards.updateStatus.path, async (req, res) => {
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
  app.get(api.settings.get.path, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put(api.settings.update.path, async (req, res) => {
    const settings = await storage.updateSettings(req.body);
    res.json(settings);
  });

  // File Upload (Public) - accepts any single file field
  app.post('/api/upload', uploadAny, (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No file provided" });
      }
      
      // Get the first (and should be only) file
      const file = Array.isArray(req.files) ? req.files[0] : (req.files as any);
      const filename = file.filename || `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      
      // Construct absolute URL using the request host
      const protocol = req.protocol || 'http';
      const host = req.get('host') || 'localhost:5000';
      const photoUrl = `${protocol}://${host}/uploads/photos/${filename}`;
      
      res.json({ photoUrl });
    } catch (err) {
      const message = err instanceof Error ? err.message : "File upload failed";
      res.status(400).json({ message });
    }
  });

  return httpServer;
}
