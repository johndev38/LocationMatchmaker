import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Créer un nouveau contrat entre un propriétaire et un locataire
export const createContract = async (req: Request, res: Response) => {
  try {
    const { offerId, tenantId, landlordId, price, propertyId, startDate, endDate } = req.body;
    const userId = req.user?.id; // Supposé être défini par un middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que l'utilisateur est bien le locataire
    if (userId !== tenantId) {
      return res.status(403).json({ message: "Seul le locataire peut créer un contrat" });
    }

    // Vérifier que l'offre existe et est en statut "pending"
    const offer = await prisma.propertyOffer.findUnique({
      where: { id: Number(offerId) },
      include: { request: true }
    });

    if (!offer) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    // Vérifier que l'offre n'a pas déjà un contrat
    const existingContract = await prisma.contract.findFirst({
      where: { offerId: Number(offerId) }
    });

    if (existingContract) {
      return res.status(400).json({ message: "Un contrat existe déjà pour cette offre" });
    }

    // Créer le contrat
    const contract = await prisma.contract.create({
      data: {
        offerId: Number(offerId),
        tenantId: tenantId,
        landlordId: landlordId,
        price: Number(price),
        propertyId: Number(propertyId),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Mettre à jour le statut de l'offre à "accepted" si ce n'est pas déjà fait
    await prisma.propertyOffer.update({
      where: { id: Number(offerId) },
      data: { status: 'accepted' }
    });

    // Mettre à jour le statut de la demande à "completed"
    if (offer.request) {
      await prisma.rentalRequest.update({
        where: { id: offer.request.id },
        data: { status: 'completed' }
      });
    }

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

    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { tenantId: userId },
          { landlordId: userId }
        ]
      },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        offer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

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

    const contract = await prisma.contract.findUnique({
      where: { id: Number(contractId) },
      include: {
        property: true,
        tenant: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        landlord: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        offer: true
      }
    });

    if (!contract) {
      return res.status(404).json({ message: "Contrat non trouvé" });
    }

    // Vérifier que l'utilisateur est soit le locataire, soit le propriétaire du contrat
    if (contract.tenantId !== userId && contract.landlordId !== userId) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à accéder à ce contrat" });
    }

    return res.status(200).json(contract);
  } catch (error) {
    console.error("Erreur lors de la récupération du contrat:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération du contrat" });
  }
}; 