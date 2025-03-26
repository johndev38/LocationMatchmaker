import { Request, Response } from 'express';
import { storage } from '../../storage';

// Créer une nouvelle réservation
export const createReservation = async (req: Request, res: Response) => {
  try {
    const { propertyId, landlordId, startDate, endDate, totalPrice, specialRequests } = req.body;
    const userId = req.user?.id; // Défini par le middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que l'utilisateur est le locataire
    const tenantId = userId;

    // Vérifier que les dates sont valides
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ message: "La date de début doit être antérieure à la date de fin" });
    }
    
    if (start < new Date()) {
      return res.status(400).json({ message: "La date de début doit être dans le futur" });
    }

    // Créer la réservation
    const reservation = await storage.createReservation({
      propertyId: parseInt(propertyId),
      tenantId,
      landlordId: parseInt(landlordId),
      startDate,
      endDate,
      totalPrice: parseFloat(totalPrice),
      specialRequests
    });

    return res.status(201).json(reservation);
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la création de la réservation" });
  }
};

// Récupérer toutes les réservations d'un utilisateur
export const getUserReservations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const reservations = await storage.getUserReservations(userId);
    return res.status(200).json(reservations);
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des réservations" });
  }
};

// Récupérer une réservation spécifique
export const getReservationById = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const reservation = await storage.getReservationById(parseInt(reservationId), userId);

    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }

    return res.status(200).json(reservation);
  } catch (error) {
    console.error("Erreur lors de la récupération de la réservation:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération de la réservation" });
  }
};

// Mettre à jour le statut d'une réservation (propriétaire uniquement)
export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que le statut est valide
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    try {
      const updatedReservation = await storage.updateReservationStatus(parseInt(reservationId), status, userId);
      return res.status(200).json(updatedReservation);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(403).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut de la réservation" });
  }
};

// Mettre à jour le statut de paiement d'une réservation (locataire uniquement)
export const updateReservationPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.params;
    const { paymentStatus } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que le statut de paiement est valide
    const validPaymentStatuses = ['unpaid', 'partially_paid', 'paid'];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Statut de paiement invalide" });
    }

    try {
      const updatedReservation = await storage.updateReservationPaymentStatus(parseInt(reservationId), paymentStatus, userId);
      return res.status(200).json(updatedReservation);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(403).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de paiement:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut de paiement" });
  }
}; 