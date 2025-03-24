// Mise à jour du statut d'une offre
export const updateOfferStatus = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;
    const userId = req.userId; // Supposé être défini par un middleware d'authentification

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifier que le statut est valide
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide. Utilisez 'pending', 'accepted' ou 'rejected'" });
    }

    // Récupérer l'offre
    const offer = await prisma.propertyOffer.findUnique({
      where: { id: parseInt(offerId) },
      include: {
        request: true, // Inclure la demande liée à l'offre
        property: true, // Inclure la propriété liée à l'offre
      }
    });

    if (!offer) {
      return res.status(404).json({ message: "Offre non trouvée" });
    }

    // Vérifier que l'utilisateur est autorisé à modifier cette offre
    // L'utilisateur doit être soit le propriétaire de la demande, soit le propriétaire de l'offre
    const isRequestOwner = offer.request?.userId === userId;
    const isOfferOwner = offer.property?.userId === userId;

    if (!isRequestOwner && !isOfferOwner) {
      return res.status(403).json({ 
        message: "Non autorisé: Vous n'êtes ni le demandeur ni le propriétaire de cette offre",
        yourId: userId,
        requestOwnerId: offer.request?.userId,
        offerOwnerId: offer.property?.userId
      });
    }

    // Seul le demandeur (locataire) peut accepter ou rejeter une offre
    if ((status === 'accepted' || status === 'rejected') && !isRequestOwner) {
      return res.status(403).json({ message: "Seul le demandeur peut accepter ou rejeter une offre" });
    }

    // Si une offre est déjà acceptée ou rejetée, on ne peut pas modifier son statut
    if (offer.status === 'accepted' || offer.status === 'rejected') {
      return res.status(400).json({ message: `Cette offre a déjà été ${offer.status === 'accepted' ? 'acceptée' : 'rejetée'}` });
    }

    // Mettre à jour le statut de l'offre
    const updatedOffer = await prisma.propertyOffer.update({
      where: { id: parseInt(offerId) },
      data: { status },
      include: {
        property: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Si l'offre est acceptée, créer un contrat entre le propriétaire et le locataire
    // Note: La création du contrat est maintenant gérée par le frontend

    // Renvoyer l'offre mise à jour
    return res.status(200).json(updatedOffer);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de l'offre:", error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour du statut" });
  }
}; 