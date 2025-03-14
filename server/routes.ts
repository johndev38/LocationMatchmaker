import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRentalRequestSchema, insertPropertyOfferSchema, insertMessageSchema, rentalRequests } from "@shared/schema";
import express from 'express';
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { upload } from "./upload";

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
        amenities: validatedData.amenities || null,
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
      const offer = await storage.createPropertyOfferWithNotification(req.user!.id, {
        ...validatedData,
        availableAmenities: validatedData.availableAmenities || null,
      });
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
        phone: user.phone || '',
        isLandlord: user.isLandlord
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

  // Route pour récupérer les offres d'un propriétaire
  app.get("/api/landlord/property-offers", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    try {
      const offers = await storage.getLandlordOffers(req.user!.id);
      res.json(offers);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des offres" });
    }
  });

  // Route pour accepter ou refuser une offre
  app.put("/api/property-offers/:offerId/status", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }

    const { status } = req.body;
    const offerId = parseInt(req.params.offerId);

    if (!status || (status !== "accepted" && status !== "rejected")) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    try {
      const offer = await storage.updatePropertyOfferStatus(offerId, status, req.user!.id);
      res.json(offer);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour du statut de l'offre" });
    }
  });

  // Routes pour les notifications
  
  // Récupérer les notifications de l'utilisateur connecté
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération des notifications" });
    }
  });

  // Marquer une notification comme lue
  app.put("/api/notifications/:notificationId/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const notification = await storage.markNotificationAsRead(parseInt(req.params.notificationId));
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour de la notification" });
    }
  });

  // Marquer toutes les notifications comme lues
  app.put("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la mise à jour des notifications" });
    }
  });

  // Route pour supprimer une demande de location
  app.delete("/api/rental-requests/:requestId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const requestId = parseInt(req.params.requestId);
      // Suppression directe sans passer par storage.deleteRentalRequest
      await db
        .delete(rentalRequests)
        .where(and(
          eq(rentalRequests.id, requestId),
          eq(rentalRequests.userId, req.user!.id)
        ));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rental request:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la demande" });
    }
  });

  // Routes pour la gestion des propriétés
  
  // Récupérer la propriété du propriétaire connecté
  app.get("/api/property", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    try {
      const property = await storage.getProperty(req.user!.id);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Erreur lors de la récupération de la propriété" });
    }
  });

  // Créer ou mettre à jour une propriété
  app.put("/api/property", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    
    try {
      const formData = req.body;
      
      // Extraire les données du formulaire
      const propertyData = {
        title: formData.title || "",
        description: formData.description || "",
        address: formData.address || "",
        amenities: formData.amenities ? JSON.parse(formData.amenities) : [],
      };
      
      const property = await storage.updateProperty(req.user!.id, propertyData);
      res.json(property);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la propriété:", error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la propriété" });
    }
  });

  // Ajouter une photo à la propriété
  app.post("/api/property/photo", upload.single("photo"), async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "Aucune photo fournie" });
    }
    
    try {
      // Récupérer la propriété du propriétaire
      const property = await storage.getProperty(req.user!.id);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      
      // Enregistrer la photo et obtenir l'URL
      const photoUrl = `/uploads/${req.file.filename}`;
      
      // Ajouter l'URL de la photo à la propriété
      const updatedProperty = await storage.addPropertyPhoto(property.id, photoUrl);
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la photo:", error);
      res.status(500).json({ error: "Erreur lors de l'ajout de la photo" });
    }
  });
  
  // Supprimer une photo de la propriété
  app.delete("/api/property/photos", async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    
    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "URL de la photo non fournie" });
    }
    
    try {
      // Récupérer la propriété du propriétaire
      const property = await storage.getProperty(req.user!.id);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      
      // Supprimer la photo
      const updatedProperty = await storage.deletePropertyPhoto(property.id, photoUrl);
      
      // Supprimer le fichier du système de fichiers (optionnel)
      // fs.unlinkSync(path.join(__dirname, "..", "public", photoUrl));
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Erreur lors de la suppression de la photo:", error);
      res.status(500).json({ error: "Erreur lors de la suppression de la photo" });
    }
  });

  // Créer la route pour l'upload des photos via FormData (nouvelle méthode)
  app.post("/api/property/upload-photo", upload.single("photo"), async (req, res) => {
    if (!req.isAuthenticated() || !req.user!.isLandlord) {
      return res.sendStatus(401);
    }
    
    if (!req.file) {
      return res.status(400).json({ error: "Aucune photo fournie" });
    }
    
    try {
      // Récupérer la propriété du propriétaire
      const property = await storage.getProperty(req.user!.id);
      if (!property) {
        return res.status(404).json({ error: "Propriété non trouvée" });
      }
      
      // Enregistrer la photo et obtenir l'URL
      const photoUrl = `/uploads/${req.file.filename}`;
      
      // Ajouter l'URL de la photo à la propriété
      const updatedProperty = await storage.addPropertyPhoto(property.id, photoUrl);
      
      res.json(updatedProperty);
    } catch (error) {
      console.error("Erreur lors de l'upload de la photo:", error);
      res.status(500).json({ error: "Erreur lors de l'upload de la photo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

export default router;
