import { Request, Response } from 'express';
import { db } from '../../../db';
import { reservations, properties, users } from '../../../schema';
import { eq, and, or, desc } from 'drizzle-orm';

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

    // Logs pour déboguer
    console.log("Création d'une réservation avec les données suivantes:");
    console.log({ propertyId, tenantId, landlordId, startDate, endDate, totalPrice, specialRequests });
    
    // Vérifier que le propriétaire existe
    const landlord = await db.query.users.findFirst({
      where: eq(users.id, parseInt(landlordId.toString())),
    });
    
    if (!landlord) {
      console.error(`Propriétaire (ID: ${landlordId}) non trouvé dans la base de données`);
      return res.status(404).json({ message: "Propriétaire non trouvé" });
    }

    // Créer la réservation
    const [newReservation] = await db.insert(reservations).values({
      propertyId: parseInt(propertyId.toString()),
      tenantId,
      landlordId: parseInt(landlordId.toString()),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice: parseFloat(totalPrice.toString()),
      status: "pending",
      paymentStatus: "unpaid",
      specialRequests: specialRequests || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json(newReservation);
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la création de la réservation" });
  }
};

// Récupérer toutes les réservations de l'utilisateur
export const getUserReservations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    
    const userReservations = await db.query.reservations.findMany({
      where: (reservations) => {
        return or(
          eq(reservations.tenantId, userId),
          eq(reservations.landlordId, userId)
        );
      },
      with: {
        property: true,
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        landlord: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: (reservations) => reservations.createdAt,
    });
    
    return res.json(userReservations);
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des réservations" });
  }
};

// Récupérer une réservation spécifique
export const getReservationById = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reservationId = parseInt(req.params.reservationId);
    
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    
    const reservation = await db.query.reservations.findFirst({
      where: (reservations) => {
        return and(
          eq(reservations.id, reservationId),
          or(
            eq(reservations.tenantId, userId),
            eq(reservations.landlordId, userId)
          )
        );
      },
      with: {
        property: true,
        tenant: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
        landlord: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée" });
    }
    
    return res.json(reservation);
  } catch (error) {
    console.error("Erreur lors de la récupération de la réservation:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération de la réservation" });
  }
};

// Mettre à jour le statut d'une réservation (accessible uniquement pour le propriétaire)
export const updateReservationStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reservationId = parseInt(req.params.reservationId);
    const { status } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    
    // Vérifier que le statut est valide
    if (!status || !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }
    
    // Vérifier que la réservation existe et que l'utilisateur est le propriétaire
    const reservation = await db.query.reservations.findFirst({
      where: (reservations) => {
        return and(
          eq(reservations.id, reservationId),
          eq(reservations.landlordId, userId)
        );
      },
    });
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée ou vous n'êtes pas autorisé à la modifier" });
    }
    
    // Mettre à jour le statut
    const [updatedReservation] = await db
      .update(reservations)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, reservationId))
      .returning();
    
    return res.json(updatedReservation);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
    
    if (error instanceof Error && error.message.includes("non autorisé")) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette réservation" });
    }
    
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut de la réservation" });
  }
};

// Mettre à jour le statut de paiement d'une réservation (accessible uniquement pour le locataire)
export const updateReservationPaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const reservationId = parseInt(req.params.reservationId);
    const { paymentStatus } = req.body;
    
    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }
    
    // Vérifier que le statut de paiement est valide
    if (!paymentStatus || !['unpaid', 'partially_paid', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({ message: "Statut de paiement invalide" });
    }
    
    // Vérifier que la réservation existe et que l'utilisateur est le locataire
    const reservation = await db.query.reservations.findFirst({
      where: (reservations) => {
        return and(
          eq(reservations.id, reservationId),
          eq(reservations.tenantId, userId)
        );
      },
    });
    
    if (!reservation) {
      return res.status(404).json({ message: "Réservation non trouvée ou vous n'êtes pas autorisé à la modifier" });
    }
    
    // Mettre à jour le statut de paiement
    const [updatedReservation] = await db
      .update(reservations)
      .set({ 
        paymentStatus,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, reservationId))
      .returning();
    
    return res.json(updatedReservation);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de paiement de la réservation:", error);
    
    if (error instanceof Error && error.message.includes("non autorisé")) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à modifier cette réservation" });
    }
    
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut de paiement de la réservation" });
  }
}; 