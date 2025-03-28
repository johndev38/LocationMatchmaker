import { Request, Response } from 'express';
import { DatabaseStorage } from '../../storage';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { propertyOffers, properties } from '@shared/schema';

// On initialise une instance directement au lieu d'utiliser une importation
const storage = new DatabaseStorage();

// Créer un nouveau contrat entre un propriétaire et un locataire
export const createContract = async (req: Request, res: Response) => {
  try {
    const { offerId, tenantId, landlordId, price, propertyId, startDate, endDate } = req.body;
    const userId = req.user?.id; // Défini par le middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Convertir les ID en nombre pour la comparaison
    const userIdNum = Number(userId);
    const tenantIdNum = Number(tenantId);

    // Vérifier que l'utilisateur est bien le locataire
    if (userIdNum !== tenantIdNum) {
      return res.status(403).json({ message: "Seul le locataire peut créer un contrat" });
    }

    // Vérifier que les valeurs numériques sont valides
    const offerIdInt = parseInt(offerId);
    if (isNaN(offerIdInt)) {
      return res.status(400).json({ message: "ID d'offre invalide" });
    }

    const propertyIdInt = parseInt(propertyId);
    if (isNaN(propertyIdInt)) {
      return res.status(400).json({ message: "ID de propriété invalide" });
    }

    const tenantIdInt = parseInt(tenantId);
    if (isNaN(tenantIdInt)) {
      return res.status(400).json({ message: "ID de locataire invalide" });
    }

    const landlordIdInt = parseInt(landlordId);
    if (isNaN(landlordIdInt)) {
      return res.status(400).json({ message: "ID de propriétaire invalide" });
    }

    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat <= 0) {
      return res.status(400).json({ message: "Prix invalide" });
    }

    // Nous utilisons directement l'ID de propriété passé par le client,
    // car il a déjà fait la vérification et la logique de fallback
    console.log("ID de propriété reçu:", propertyIdInt);
    console.log("ID d'offre reçu:", offerIdInt);

    console.log("Données du contrat avant création :", {
      offerId: offerIdInt,
      tenantId: tenantIdInt,
      landlordId: landlordIdInt,
      price: priceFloat,
      propertyId: propertyIdInt,
      startDate,
      endDate
    });

    // Créer le contrat
    const contract = await storage.createContract({
      offerId: offerIdInt,
      tenantId: tenantIdInt,
      landlordId: landlordIdInt,
      price: priceFloat,
      propertyId: propertyIdInt,
      startDate,
      endDate
    });

    return res.status(201).json(contract);
  } catch (error) {
    console.error("Erreur lors de la création du contrat:", error);
    
    // Vérifier si c'est une erreur concernant un contrat existant
    if (error instanceof Error && error.message.includes("déjà sous contrat")) {
      return res.status(409).json({ 
        message: error.message,
        error: "PROPERTY_ALREADY_CONTRACTED" 
      });
    }
    
    return res.status(500).json({ message: "Erreur serveur lors de la création du contrat" });
  }
};

// Récupérer tous les contrats d'un utilisateur (soit en tant que locataire, soit en tant que propriétaire)
export const getUserContracts = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const contracts = await storage.getUserContracts(userId);
    return res.status(200).json(contracts);
  } catch (error) {
    console.error("Erreur lors de la récupération des contrats:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des contrats" });
  }
};

// Récupérer un contrat spécifique
export const getContractById = async (req: Request, res: Response) => {
  try {
    const { contractId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    const contract = await storage.getContractById(parseInt(contractId), userId);

    if (!contract) {
      return res.status(404).json({ message: "Contrat non trouvé" });
    }

    return res.status(200).json(contract);
  } catch (error) {
    console.error("Erreur lors de la récupération du contrat:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération du contrat" });
  }
}; 