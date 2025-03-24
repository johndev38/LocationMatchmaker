import { Request, Response } from 'express';
import { storage } from '../../storage';

// Créer un nouveau contrat entre un propriétaire et un locataire
export const createContract = async (req: Request, res: Response) => {
  try {
    const { offerId, tenantId, landlordId, price, propertyId, startDate, endDate } = req.body;
    const userId = req.user?.id; // Défini par le middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que l'utilisateur est bien le locataire
    if (userId !== tenantId) {
      return res.status(403).json({ message: "Seul le locataire peut créer un contrat" });
    }

    // Vérifier que l'offre existe
    const offers = await storage.getPropertyOffers(parseInt(propertyId));
    const offer = offers.find(o => o.id === parseInt(offerId));

    if (!offer) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    // Créer le contrat
    const contract = await storage.createContract({
      offerId: parseInt(offerId),
      tenantId: parseInt(tenantId),
      landlordId: parseInt(landlordId),
      price: parseFloat(price),
      propertyId: parseInt(propertyId),
      startDate,
      endDate
    });

    return res.status(201).json(contract);
  } catch (error) {
    console.error("Erreur lors de la création du contrat:", error);
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