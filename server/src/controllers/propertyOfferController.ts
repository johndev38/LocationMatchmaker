import { Request, Response } from 'express';
import { storage } from '../../storage';

// Mise à jour du statut d'une offre
export const updateOfferStatus = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id; // Défini par le middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const offerIdInt = parseInt(offerId);
    if (isNaN(offerIdInt)) {
      return res.status(400).json({ message: "ID d'offre invalide" });
    }

    // Vérifier que le statut est valide
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide. Utilisez 'pending', 'accepted' ou 'rejected'" });
    }

    try {
      // Mettre à jour le statut de l'offre
      const updatedOffer = await storage.updatePropertyOfferStatus(offerIdInt, status, userId);
      
      // Si l'offre est acceptée et que l'utilisateur est le locataire (la personne qui a fait la demande)
      // Nous ne créons plus le contrat automatiquement ici, nous renvoyons simplement l'offre mise à jour
      // Le frontend se chargera de rediriger vers la création de contrat ou de réservation

      return res.status(200).json(updatedOffer);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de l'offre:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut" });
  }
}; 