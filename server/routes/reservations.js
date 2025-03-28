const express = require("express");
const router = express.Router();
const { db } = require("../db");
const { reservations, properties, users } = require("../schema");
const { eq, and } = require("drizzle-orm");
const authenticate = require("../middleware/authenticate");

// GET: Récupérer toutes les réservations de l'utilisateur (en tant que locataire ou propriétaire)
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer toutes les réservations où l'utilisateur est soit le locataire soit le propriétaire
    const userReservations = await db.query.reservations.findMany({
      where: (reservations) => {
        return and(
          eq(reservations.tenantId, userId).or(eq(reservations.landlordId, userId))
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
      orderBy: (reservations) => reservations.createdAt.desc(),
    });

    console.log(`Récupération de ${userReservations.length} réservations pour l'utilisateur ${userId}`);
    
    res.json(userReservations);
  } catch (error) {
    console.error("Erreur lors de la récupération des réservations:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des réservations" });
  }
});

// GET: Récupérer une réservation spécifique par ID
router.get("/:id", authenticate, async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const userId = req.user.id;

    const reservation = await db.query.reservations.findFirst({
      where: (reservations) => {
        return and(
          eq(reservations.id, reservationId),
          and(
            eq(reservations.tenantId, userId).or(eq(reservations.landlordId, userId))
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
      return res.status(404).json({ error: "Réservation non trouvée" });
    }

    console.log(`Récupération de la réservation ${reservationId} pour l'utilisateur ${userId}`);
    
    res.json(reservation);
  } catch (error) {
    console.error("Erreur lors de la récupération de la réservation:", error);
    res.status(500).json({ error: "Erreur lors de la récupération de la réservation" });
  }
});

// POST: Créer une nouvelle réservation
router.post("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId, landlordId, startDate, endDate, totalPrice, specialRequests } = req.body;

    if (!propertyId || !landlordId || !startDate || !endDate || !totalPrice) {
      return res.status(400).json({ error: "Toutes les informations requises doivent être fournies" });
    }

    // Vérifier que la propriété existe
    const property = await db.query.properties.findFirst({
      where: eq(properties.id, propertyId),
    });

    if (!property) {
      return res.status(404).json({ error: "Propriété non trouvée" });
    }

    // Vérifier que le propriétaire existe
    const landlord = await db.query.users.findFirst({
      where: eq(users.id, landlordId),
    });

    if (!landlord) {
      return res.status(404).json({ error: "Propriétaire non trouvé" });
    }

    // Créer la réservation
    const newReservation = await db.insert(reservations).values({
      propertyId,
      tenantId: userId,
      landlordId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalPrice,
      status: "pending",
      paymentStatus: "unpaid",
      specialRequests: specialRequests || null,
      createdAt: new Date(),
    }).returning();

    console.log(`Nouvelle réservation créée: ${newReservation[0].id}`);

    res.status(201).json(newReservation[0]);
  } catch (error) {
    console.error("Erreur lors de la création de la réservation:", error);
    res.status(500).json({ error: "Erreur lors de la création de la réservation" });
  }
});

// PATCH: Mettre à jour le statut d'une réservation (proprietaire uniquement)
router.patch("/:id/status", authenticate, async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const userId = req.user.id;
    const { status } = req.body;

    if (!status || !["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
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
      return res.status(404).json({ error: "Réservation non trouvée ou vous n'êtes pas autorisé à la modifier" });
    }

    // Mettre à jour le statut
    const updatedReservation = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, reservationId))
      .returning();

    console.log(`Statut de la réservation ${reservationId} mis à jour: ${status}`);
    
    res.json(updatedReservation[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut de la réservation" });
  }
});

// PATCH: Mettre à jour le statut de paiement d'une réservation (locataire uniquement)
router.patch("/:id/payment", authenticate, async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const userId = req.user.id;
    const { paymentStatus } = req.body;

    if (!paymentStatus || !["unpaid", "partially_paid", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ error: "Statut de paiement invalide" });
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
      return res.status(404).json({ error: "Réservation non trouvée ou vous n'êtes pas autorisé à la modifier" });
    }

    // Mettre à jour le statut de paiement
    const updatedReservation = await db
      .update(reservations)
      .set({ paymentStatus })
      .where(eq(reservations.id, reservationId))
      .returning();

    console.log(`Statut de paiement de la réservation ${reservationId} mis à jour: ${paymentStatus}`);
    
    res.json(updatedReservation[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de paiement de la réservation:", error);
    res.status(500).json({ error: "Erreur lors de la mise à jour du statut de paiement de la réservation" });
  }
});

// DELETE: Annuler une réservation (uniquement si en attente)
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const userId = req.user.id;

    // Vérifier que la réservation existe et que l'utilisateur est soit le locataire soit le propriétaire
    const reservation = await db.query.reservations.findFirst({
      where: (reservations) => {
        return and(
          eq(reservations.id, reservationId),
          and(
            eq(reservations.tenantId, userId).or(eq(reservations.landlordId, userId))
          )
        );
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: "Réservation non trouvée ou vous n'êtes pas autorisé à la supprimer" });
    }

    // Vérifier que la réservation est en attente
    if (reservation.status !== "pending") {
      return res.status(400).json({ error: "Seules les réservations en attente peuvent être annulées" });
    }

    // Annuler la réservation (mettre à jour le statut)
    const updatedReservation = await db
      .update(reservations)
      .set({ status: "cancelled" })
      .where(eq(reservations.id, reservationId))
      .returning();

    console.log(`Réservation ${reservationId} annulée`);
    
    res.json({ message: "Réservation annulée avec succès", reservation: updatedReservation[0] });
  } catch (error) {
    console.error("Erreur lors de l'annulation de la réservation:", error);
    res.status(500).json({ error: "Erreur lors de l'annulation de la réservation" });
  }
});

export default router; 