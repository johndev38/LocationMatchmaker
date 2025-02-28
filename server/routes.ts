import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRentalRequestSchema, insertPropertyOfferSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/rental-requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertRentalRequestSchema.parse(req.body);
      const request = await storage.createRentalRequest(req.user!.id, validatedData);
      res.status(201).json(request);
    } catch (error) {
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

  const httpServer = createServer(app);
  return httpServer;
}
