import { IStorage } from "./types";
import type {
  User,
  InsertUser,
  RentalRequest,
  PropertyOffer,
  Message,
  Notification,
  Reservation,
} from "@shared/schema";
import { CreateReservationData } from "./types";
import { users, rentalRequests, propertyOffers, messages, notifications, properties, reservations } from "@shared/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { pgTable, serial, text, integer, boolean, unique } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? { ...user, address: user.address, phone: user.phone } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createRentalRequest(
    userId: number,
    request: Omit<RentalRequest, "id" | "userId" | "status">
  ): Promise<RentalRequest> {
    const [rentalRequest] = await db
      .insert(rentalRequests)
      .values({
        userId: userId,
        status: "active",
        adults: request.adults,
        children: request.children,
        babies: request.babies,
        pets: request.pets,
        departureCity: request.departureCity,
        locationType: sql.raw(`ARRAY[${request.locationType.map(t => `'${t}'`).join(',')}]::text[]`),
        maxDistance: request.maxDistance,
        maxBudget: request.maxBudget,
        startDate: request.startDate,
        endDate: request.endDate,
        amenities: sql.raw(`ARRAY[${(request.amenities || []).map(a => `'${a}'`).join(',')}]::text[]`),
      })
      .returning();
    return rentalRequest;
  }

  async getRentalRequests(): Promise<RentalRequest[]> {
    const requests = await db.select().from(rentalRequests);
    return requests.map(request => ({
      ...request,
      guests: {
        adults: request.adults,
        children: request.children,
        pets: request.pets,
      },
    }));
  }

  async createPropertyOffer(
    landlordId: number,
    offer: Omit<PropertyOffer, "id" | "landlordId" | "status">
  ): Promise<PropertyOffer> {
    const [propertyOffer] = await db
      .insert(propertyOffers)
      .values({
        ...offer,
        landlordId,
        status: "pending",
      })
      .returning();
    return propertyOffer;
  }

  async getPropertyOffers(requestId: number): Promise<any[]> {
    if (isNaN(requestId) || !Number.isInteger(requestId)) {
      console.error(`getPropertyOffers appelé avec un requestId invalide: ${requestId}`);
      throw new Error(`ID de demande invalide: ${requestId}`);
    }
    console.log("Récupération des offres pour la demande:", requestId);
    // Récupérer les offres pour cette demande
    const offers = await db
      .select()
      .from(propertyOffers)
      .where(eq(propertyOffers.requestId, requestId));
    
    // Pour chaque offre, récupérer les informations de la propriété du propriétaire
    const offersWithProperties = await Promise.all(
      offers.map(async (offer) => {
        // Récupérer la propriété du propriétaire
        const [property] = await db
          .select()
          .from(properties)
          .where(eq(properties.landlordId, offer.landlordId));
        
        if (!property) {
          return offer;
        }
        
        // Combiner l'offre avec les détails de la propriété, en incluant l'ID
        return {
          ...offer,
          propertyId: property.id,
          property: {
            id: property.id,
            title: property.title,
            address: property.address,
            photos: property.photos,
            amenities: property.amenities
          }
        };
      })
    );
    
    return offersWithProperties;
  }

  async createMessage(
    message: Omit<Message, "id" | "timestamp">
  ): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        timestamp: new Date().toISOString(),
      })
      .returning();
    return newMessage;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        eq(messages.senderId, userId) || eq(messages.receiverId, userId)
      );
  }

  async getUserListings(userId: number): Promise<RentalRequest[]> {
    return await db
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.userId, userId));
  }

  async deleteRentalRequest(requestId: number, userId: number): Promise<void> {
    await db
      .delete(rentalRequests)
      .where(
        and(
          eq(rentalRequests.id, requestId),
          eq(rentalRequests.userId, userId)
        )
      );
  }

  async updateUser(id: number, data: { name: string; email: string; address: string; phone: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        username: data.name,
        email: data.email,
        address: data.address,
        phone: data.phone,
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Fonction pour créer une notification avec les paramètres séparés
  async createNotification(userId: number, type: string, content: string, relatedId?: number): Promise<Notification> {
    try {
      const [notification] = await db.insert(notifications).values({
        userId,
        type,
        content,
        relatedId: relatedId || null,
        isRead: false,
        timestamp: new Date().toISOString(),
      }).returning();
      
    return notification;
    } catch (error) {
      console.error("Erreur lors de la création de la notification:", error);
      throw error;
    }
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)        
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.id));
  }   

  async markNotificationAsRead(notificationId: number): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return notification;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Méthodes pour la gestion des offres
  async updatePropertyOfferStatus(
    offerId: number,
    status: string,
    userId: number
  ): Promise<PropertyOffer> {
    // Récupérer l'offre d'abord pour vérifier qu'elle existe
    const [existingOffer] = await db
      .select()
      .from(propertyOffers)
      .where(eq(propertyOffers.id, offerId));
    
    if (!existingOffer) {
      throw new Error(`Offre avec l'ID ${offerId} non trouvée`);
    }

    // Mettre à jour l'offre, sans vérifier le landlordId (pour permettre aux locataires de mettre à jour)
    const [offer] = await db
      .update(propertyOffers)
      .set({ 
        status: status as "pending" | "accepted" | "rejected" 
      })
      .where(eq(propertyOffers.id, offerId))
      .returning();
    
    if (!offer) {
      throw new Error(`Erreur lors de la mise à jour de l'offre ${offerId}`);
    }
    
    // Récupérer la demande associée à cette offre
    const [request] = await db
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.id, offer.requestId));
    
    if (!request) {
      throw new Error(`Demande associée à l'offre ${offerId} non trouvée`);
    }
    
    // Créer une notification pour l'utilisateur qui a fait la demande
    if (status === "accepted" || status === "rejected") {
      const notificationType = status === "accepted" ? "offer_accepted" : "offer_rejected";
      const notificationContent = status === "accepted" 
        ? "Votre demande a été acceptée par un propriétaire!"
        : "Une offre sur votre demande a été refusée par un propriétaire.";
      
      await this.createNotification(
        request.userId,
        notificationType,
        notificationContent,
        offerId
      );
      
      // Si l'offre est acceptée, créer automatiquement une réservation
      if (status === "accepted") {
        try {
          // Récupérer les informations de la propriété du propriétaire
          const [property] = await db
            .select()
            .from(properties)
            .where(eq(properties.landlordId, offer.landlordId));
          
          if (!property) {
            console.error(`Propriété du propriétaire (ID: ${offer.landlordId}) non trouvée`);
            throw new Error(`Propriété du propriétaire non trouvée`);
          }
          
          // Calculer les dates de début et de fin à partir de la demande
          const startDate = new Date(request.startDate);
          const endDate = new Date(request.endDate);
          
          // Créer les données de réservation
          const reservationData: CreateReservationData = {
            propertyId: property.id,
            tenantId: request.userId,
            landlordId: offer.landlordId,
            startDate: startDate,
            endDate: endDate,
            totalPrice: offer.price,
            specialRequests: "",
            offerId: offer.id
          };
          
          // Créer la réservation
          await this.createReservation(reservationData);
          console.log("Réservation créée automatiquement suite à l'acceptation de l'offre");
        } catch (error) {
          console.error("Erreur lors de la création automatique de la réservation:", error);
          // On ne fait pas échouer la mise à jour du statut de l'offre si la création de la réservation échoue
        }
      }
    }
    
    return offer;
  }

  async getLandlordOffers(landlordId: number): Promise<PropertyOffer[]> {
    return await db
      .select()
      .from(propertyOffers)
      .where(eq(propertyOffers.landlordId, landlordId));
  }

  // Méthode pour créer une offre avec notification
  async createPropertyOfferWithNotification(
    landlordId: number,
    offer: Omit<PropertyOffer, "id" | "landlordId" | "status">
  ): Promise<PropertyOffer> {
    // Créer l'offre
    const propertyOffer = await this.createPropertyOffer(landlordId, offer);
    
    // Récupérer les informations de la demande
    const [request] = await db
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.id, offer.requestId));
    
    if (request) {
      // Récupérer les informations du propriétaire
      const [landlord] = await db
        .select()
        .from(users)
        .where(eq(users.id, landlordId));
      
      // Créer une notification pour l'utilisateur qui a fait la demande
      await this.createNotification(
        request.userId,
        "new_offer",
        `Vous avez reçu une nouvelle offre pour votre demande de ${request.departureCity} de la part de ${landlord.username}.`,
        propertyOffer.id
      );
    }
    
    return propertyOffer;
  }

  // Méthodes pour la gestion des propriétés
  async getProperty(landlordId: number) {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.landlordId, landlordId));
    
    return property || null;
  }

  async createProperty(landlordId: number, propertyData: any) {
    const [property] = await db
      .insert(properties)
      .values({
        ...propertyData,
        landlordId,
        photos: propertyData.photos || [],
        amenities: propertyData.amenities || [],
      })
      .returning();
    
    return property;
  }

  async updateProperty(landlordId: number, propertyData: any) {
    const [existingProperty] = await db
      .select()
      .from(properties)
      .where(eq(properties.landlordId, landlordId));

    if (!existingProperty) {
      return this.createProperty(landlordId, propertyData);
    }

    const [property] = await db
      .update(properties)
      .set({
        ...propertyData,
        updatedAt: new Date(),
      })
      .where(eq(properties.landlordId, landlordId))
      .returning();
    
    return property;
  }

  async addPropertyPhoto(propertyId: number, photoUrl: string) {
    console.log("Adding photo:", photoUrl, "to property:", propertyId);
    
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (!property) {
      throw new Error("Property not found");
    }

    const updatedPhotos = [...(property.photos || []), photoUrl];
    console.log("Updated photos array:", updatedPhotos);
    
    const [updatedProperty] = await db
      .update(properties)
      .set({
        photos: updatedPhotos,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();
    
    return updatedProperty;
  }

  async deletePropertyPhoto(propertyId: number, photoUrl: string) {
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (!property) {
      throw new Error("Property not found");
    }

    const updatedPhotos = (property.photos || []).filter(photo => photo !== photoUrl);
    
    const [updatedProperty] = await db
      .update(properties)
      .set({
        photos: updatedPhotos,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, propertyId))
      .returning();
    
    return updatedProperty;
  }

  // Méthodes pour la gestion des contrats
  
  // La fonction createContract est remplacée par une redirection vers createReservation
  async createContract(contractData: CreateReservationData): Promise<Reservation> {
    console.log("Conversion de contrat en réservation");
    
    // Créer une réservation avec les données du contrat
    const reservationData: CreateReservationData = {
      propertyId: contractData.propertyId,
      tenantId: contractData.tenantId,
      landlordId: contractData.landlordId,
      startDate: typeof contractData.startDate === 'string' 
        ? contractData.startDate 
        : contractData.startDate.toISOString(),
      endDate: typeof contractData.endDate === 'string'
        ? contractData.endDate
        : contractData.endDate.toISOString(),
      totalPrice: contractData.totalPrice || 0,
      offerId: contractData.offerId
    };
    
    return this.createReservation(reservationData);
  }
  
  // La fonction getUserContracts est remplacée par une redirection vers getUserReservations
  async getUserContracts(userId: number): Promise<Reservation[]> {
    console.log("Redirection vers getUserReservations");
    return this.getUserReservations(userId);
  }

  // La fonction getContractById est remplacée par une redirection vers getReservationById
  async getContractById(contractId: number, userId: number): Promise<Reservation | null> {
    console.log("Redirection vers getReservationById");
    return this.getReservationById(contractId, userId);
  }

  // Méthodes pour les réservations
  async createReservation(reservationData: CreateReservationData): Promise<Reservation> {
    try {
      console.log("Création d'une réservation avec les données:", JSON.stringify(reservationData, null, 2));
      
      // S'assurer que le landlordId est défini
      if (!reservationData.landlordId) {
        console.error("LandlordId manquant dans les données de réservation");
        throw new Error("Le champ landlordId est requis pour créer une réservation");
      }

      // Vérifier si le propriétaire existe
      const [landlord] = await db.select().from(users).where(
        eq(users.id, reservationData.landlordId)
      );
      
      console.log("Propriétaire trouvé:", landlord ? `${landlord.id} (${landlord.username})` : "NON TROUVÉ");
      
      if (!landlord) {
        throw new Error(`Propriétaire (ID: ${reservationData.landlordId}) non trouvé dans la base de données`);
      }

      // Vérifier si la propriété existe
      const [property] = await db.select().from(properties).where(
        eq(properties.id, reservationData.propertyId)
      );
      
      console.log("Propriété trouvée:", property ? `${property.id} (${property.title})` : "NON TROUVÉE");
      
      if (!property) {
        throw new Error(`Propriété (ID: ${reservationData.propertyId}) non trouvée dans la base de données`);
      }
      
      // Vérifier si le landlordId correspond à la propriété
      if (property.landlordId !== reservationData.landlordId) {
        console.warn(`Le landlordId (${reservationData.landlordId}) ne correspond pas au propriétaire de la propriété (${property.landlordId}). Correction...`);
        // Utiliser le landlordId de la propriété comme valeur correcte
        reservationData.landlordId = property.landlordId;
      }
      
      // Créer la réservation
      const [newReservation] = await db.insert(reservations).values({
        propertyId: reservationData.propertyId,
        tenantId: reservationData.tenantId,
        landlordId: reservationData.landlordId,
        startDate: new Date(reservationData.startDate),
        endDate: new Date(reservationData.endDate),
        totalPrice: reservationData.totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        specialRequests: reservationData.specialRequests || null,
        offerId: reservationData.offerId || null
      }).returning();
      
      console.log("Réservation créée avec succès, ID:", newReservation.id);
      
      // Créer une notification pour le propriétaire
      await this.createNotification(
        reservationData.landlordId,
        "reservation_requested",
        `Nouvelle demande de réservation reçue`,
        newReservation.id
      );
      
      // Récupérer la réservation complète
      const reservation = await this.getReservationById(newReservation.id, reservationData.tenantId);
      if (!reservation) {
        throw new Error(`Impossible de récupérer la réservation créée avec l'ID ${newReservation.id}`);
      }
      return reservation;
    } catch (error) {
      console.error("Erreur lors de la création de la réservation:", error);
      throw error;
    }
  }
  
  async getUserReservations(userId: number): Promise<Reservation[]> {
    try {
      // Utilisons une approche plus simple sans les relations de Drizzle
      const userReservations = await db
        .select()
        .from(reservations)
        .where(
          or(
            eq(reservations.tenantId, userId),
            eq(reservations.landlordId, userId)
          )
        )
        .orderBy(desc(reservations.createdAt));
      
      // Manuellement récupérer les informations liées pour chaque réservation
      const detailedReservations = await Promise.all(
        userReservations.map(async (reservation) => {
          // Récupérer les détails de la propriété
          const [property] = await db
            .select()
            .from(properties)
            .where(eq(properties.id, reservation.propertyId));
          
          // Récupérer les informations du locataire
          const [tenant] = await db
            .select()
            .from(users)
            .where(eq(users.id, reservation.tenantId));
          
          // Récupérer les informations du propriétaire
          const [landlord] = await db
            .select()
            .from(users)
            .where(eq(users.id, reservation.landlordId));
          
          // Récupérer les détails de l'offre si offerId est présent
          let offer = null;
          if (reservation.offerId) {
            const [offerData] = await db
            .select()
            .from(propertyOffers)
              .where(eq(propertyOffers.id, reservation.offerId));
            
            if (offerData) {
              offer = {
                id: offerData.id,
                price: offerData.price,
                description: offerData.description,
                availableAmenities: offerData.availableAmenities
              };
            }
          }
          
          // Retourner la réservation avec les détails
          return {
            ...reservation,
            property: property ? {
              id: property.id,
              title: property.title,
              address: property.address,
              photos: property.photos,
              amenities: property.amenities
            } : undefined,
            tenant: tenant ? {
              id: tenant.id,
              name: tenant.username,
              email: tenant.email
            } : undefined,
            landlord: landlord ? {
              id: landlord.id,
              name: landlord.username,
              email: landlord.email
            } : undefined,
            offer
          };
        })
      );
      
      return detailedReservations;
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      return [];
    }
  }

  async getReservationById(reservationId: number, userId: number): Promise<Reservation | null> {
    try {
      // Récupérer la réservation de base
      const [reservation] = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.id, reservationId),
            or(
              eq(reservations.tenantId, userId),
              eq(reservations.landlordId, userId)
            )
          )
        );
      
      if (!reservation) {
        return null;
      }
      
      // Récupérer les détails de la propriété
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, reservation.propertyId));
      
      // Récupérer les informations du locataire
      const [tenant] = await db
        .select()
        .from(users)
        .where(eq(users.id, reservation.tenantId));
      
      // Récupérer les informations du propriétaire
      const [landlord] = await db
        .select()
        .from(users)
        .where(eq(users.id, reservation.landlordId));
      
      // Récupérer les détails de l'offre si offerId est présent
      let offer = null;
      if (reservation.offerId) {
        const [offerData] = await db
        .select()
        .from(propertyOffers)
          .where(eq(propertyOffers.id, reservation.offerId));
        
        if (offerData) {
          offer = {
            id: offerData.id,
            price: offerData.price,
            description: offerData.description,
            availableAmenities: offerData.availableAmenities
          };
        }
      }
      
      // Retourner la réservation avec les détails
      return {
        ...reservation,
        property: property ? {
          id: property.id,
          title: property.title,
          address: property.address,
          photos: property.photos,
          amenities: property.amenities
        } : undefined,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.username,
          email: tenant.email
        } : undefined,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.username,
          email: landlord.email
        } : undefined,
        offer
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de la réservation:", error);
      return null;
    }
  }

  // Mise à jour de la méthode updateReservationStatus pour utiliser la bonne signature de createNotification
  async updateReservationStatus(reservationId: number, status: string, userId: number): Promise<Reservation> {
    try {
      const reservation = await db.query.reservations.findFirst({
        where: (reservations) => {
          return and(
            eq(reservations.id, reservationId),
            eq(reservations.landlordId, userId)
          );
        },
      });

      if (!reservation) {
        throw new Error(`Réservation (ID: ${reservationId}) non trouvée ou vous n'êtes pas autorisé à la modifier`);
      }

      const [updatedReservation] = await db
        .update(reservations)
        .set({ 
          status,
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, reservationId))
        .returning();

      // Créer une notification pour le locataire
      await this.createNotification(
        reservation.tenantId,
        `reservation_${status}`,
        `Votre réservation a été ${status === 'confirmed' ? 'confirmée' : status === 'cancelled' ? 'annulée' : 'mise à jour'} par le propriétaire.`,
        reservationId
      );

      const result = await this.getReservationById(reservationId, userId);
      if (!result) {
        throw new Error(`Impossible de récupérer la réservation mise à jour avec l'ID ${reservationId}`);
      }
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de la réservation:", error);
      throw error;
    }
  }

  // Mise à jour de la méthode updateReservationPaymentStatus pour utiliser la bonne signature de createNotification
  async updateReservationPaymentStatus(reservationId: number, paymentStatus: string, userId: number): Promise<Reservation> {
    try {
      const reservation = await db.query.reservations.findFirst({
        where: (reservations) => {
          return and(
            eq(reservations.id, reservationId),
            eq(reservations.tenantId, userId)
          );
        },
      });

      if (!reservation) {
        throw new Error(`Réservation (ID: ${reservationId}) non trouvée ou vous n'êtes pas autorisé à la modifier`);
      }

      const [updatedReservation] = await db
        .update(reservations)
        .set({ 
          paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, reservationId))
        .returning();

      // Créer une notification pour le propriétaire
      await this.createNotification(
        reservation.landlordId,
        `payment_${paymentStatus}`,
        `Le statut de paiement de la réservation a été mis à jour à "${paymentStatus}" par le locataire.`,
        reservationId
      );

      const result = await this.getReservationById(reservationId, userId);
      if (!result) {
        throw new Error(`Impossible de récupérer la réservation mise à jour avec l'ID ${reservationId}`);
      }
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de paiement:", error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      return user || null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();