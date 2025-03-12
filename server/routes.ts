import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRentalRequestSchema, insertPropertyOfferSchema, insertMessageSchema } from "@shared/schema";
import express from 'express';

const router = express.Router();

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/rental-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Convertir les chaînes de caractères en objets Date
      const requestData = {
        ...req.body,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const validatedData = insertRentalRequestSchema.parse(requestData);

      // Convertir les dates en chaînes de caractères avant de les stocker
      const request = await storage.createRentalRequest(req.user!.id, {
        ...validatedData,
        startDate: validatedData.startDate.toISOString(),
        endDate: validatedData.endDate.toISOString(),
      });

      console.log("request", request);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating rental request:", error);
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/rental-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const requests = await storage.getRentalRequests();
    res.json(requests);
  });

  app.post("/api/property-offers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }

    try {
      const validatedData = insertPropertyOfferSchema.parse(req.body);
      const offer = await storage.createPropertyOffer(req.user!.id, validatedData);
      res.status(201).json(offer);
    } catch (error) {
      res.status(400).json({ error: "Invalid offer data" });
    }
  });

  app.get("/api/property-offers/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const offers = await storage.getPropertyOffers(parseInt(req.params.requestId));
    res.json(offers);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage({
        ...validatedData,
        senderId: req.user!.id,
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages(req.user!.id);
    res.json(messages);
  });

  app.get("/api/my-listings", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const listings = await storage.getUserListings(req.user!.id);
      res.json(listings);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des annonces" });
    }
  });

  // Route pour récupérer les informations de l'utilisateur
  app.get('/api/user-info', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé" });
      }
      res.json({
        username: user.username,
        email: user.email,
        address: user.address || '',
        phone: user.phone || ''
      });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des informations de l'utilisateur" });
    }
  });

  // Route pour mettre à jour les informations de l'utilisateur
  app.post('/api/user-info', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { name, email, address, phone } = req.body;
    // Logique pour mettre à jour les informations de l'utilisateur
    try {
      const updatedUser = await storage.updateUser(req.user!.id, { name, email, address, phone });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour des informations de l'utilisateur" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;
