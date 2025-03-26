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
import { Contract, CreateContractData, CreateReservationData } from "./types";
import { users, rentalRequests, propertyOffers, messages, notifications, properties, reservations, contracts } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
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
        
        // Combiner l'offre avec les détails de la propriété
        return {
          ...offer,
          property: {
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

  // Méthodes pour les notifications
  async createNotification(
    userId: number,
    type: string,
    content: string,
    relatedId?: number
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        content,
        relatedId,
        isRead: false,
        timestamp: new Date().toISOString(),
      })
      .returning();
    return notification;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)        
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.id, "desc");
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
  
  // Créer un nouveau contrat
  async createContract(contractData: CreateContractData): Promise<Contract> {
    // S'assurer que les dates sont des chaînes ISO
    const startDate = typeof contractData.startDate === 'string' 
      ? contractData.startDate 
      : contractData.startDate.toISOString();
      
    const endDate = typeof contractData.endDate === 'string' 
      ? contractData.endDate 
      : contractData.endDate.toISOString();
    
    // Créer la requête SQL pour insérer un contrat
    const result = await db.execute(sql`
      INSERT INTO contracts (
        offer_id, tenant_id, landlord_id, price, property_id, 
        start_date, end_date, status, created_at, updated_at
      ) 
      VALUES (
        ${contractData.offerId}, ${contractData.tenantId}, ${contractData.landlordId}, 
        ${contractData.price}, ${contractData.propertyId}, 
        ${startDate}, ${endDate}, 'active', NOW(), NOW()
      )
      RETURNING *
    `);
    
    // Vérifier si nous avons un résultat
    if (!Array.isArray(result) || result.length === 0) {
      throw new Error("Erreur lors de la création du contrat");
    }
    
    const contract = result[0] as unknown as Contract;
    
    // Mettre à jour le statut de l'offre à "accepted"
    await this.updatePropertyOfferStatus(contractData.offerId, "accepted", contractData.tenantId);
    
    // Mettre à jour le statut de la demande de location à "completed"
    // D'abord récupérer l'offre pour obtenir l'ID de la demande associée
    const [offer] = await db.select().from(propertyOffers).where(eq(propertyOffers.id, contractData.offerId));
    
    if (offer && offer.requestId) {
      await db.update(rentalRequests)
        .set({ status: 'completed' as any })
        .where(eq(rentalRequests.id, offer.requestId));
    }
    
    return contract;
  }
  
  // Récupérer tous les contrats d'un utilisateur
  async getUserContracts(userId: number): Promise<Contract[]> {
    // Récupérer les contrats où l'utilisateur est soit le locataire, soit le propriétaire
    const result = await db.execute(sql`
      SELECT c.*, 
        p.title as property_title, p.address as property_address, p.photos as property_photos,
        t.id as tenant_id, t.username as tenant_name, t.email as tenant_email,
        l.id as landlord_id, l.username as landlord_name, l.email as landlord_email,
        o.description as offer_description, o.available_amenities as offer_amenities
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN users t ON c.tenant_id = t.id
      LEFT JOIN users l ON c.landlord_id = l.id
      LEFT JOIN property_offers o ON c.offer_id = o.id
      WHERE c.tenant_id = ${userId} OR c.landlord_id = ${userId}
      ORDER BY c.created_at DESC
    `);
    
    // Vérifier si nous avons des résultats
    if (!Array.isArray(result)) {
      return [];
    }
    
    // Formater les données pour correspondre à la structure attendue
    return result.map((row: any) => {
      return {
        id: row.id,
        offerId: row.offer_id,
        tenantId: row.tenant_id,
        landlordId: row.landlord_id,
        propertyId: row.property_id,
        price: row.price,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        property: {
          id: row.property_id,
          title: row.property_title,
          address: row.property_address,
          photos: row.property_photos || []
        },
        tenant: {
          id: row.tenant_id,
          name: row.tenant_name,
          email: row.tenant_email
        },
        landlord: {
          id: row.landlord_id,
          name: row.landlord_name,
          email: row.landlord_email
        },
        offer: {
          id: row.offer_id,
          price: row.price,
          description: row.offer_description,
          availableAmenities: row.offer_amenities || []
        }
      } as Contract;
    });
  }
  
  // Récupérer un contrat spécifique
  async getContractById(contractId: number, userId: number): Promise<Contract | null> {
    // Récupérer un contrat spécifique, vérifier que l'utilisateur est autorisé à y accéder
    const result = await db.execute(sql`
      SELECT c.*, 
        p.title as property_title, p.address as property_address, p.photos as property_photos,
        t.id as tenant_id, t.username as tenant_name, t.email as tenant_email,
        l.id as landlord_id, l.username as landlord_name, l.email as landlord_email,
        o.description as offer_description, o.available_amenities as offer_amenities
      FROM contracts c
      LEFT JOIN properties p ON c.property_id = p.id
      LEFT JOIN users t ON c.tenant_id = t.id
      LEFT JOIN users l ON c.landlord_id = l.id
      LEFT JOIN property_offers o ON c.offer_id = o.id
      WHERE c.id = ${contractId} AND (c.tenant_id = ${userId} OR c.landlord_id = ${userId})
    `);
    
    // Vérifier si nous avons un résultat
    if (!Array.isArray(result) || result.length === 0) {
      return null;
    }
    
    // Formater les données pour correspondre à la structure attendue
    const row = result[0] as any;
    return {
      id: row.id,
      offerId: row.offer_id,
      tenantId: row.tenant_id,
      landlordId: row.landlord_id,
      propertyId: row.property_id,
      price: row.price,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      property: {
        id: row.property_id,
        title: row.property_title,
        address: row.property_address,
        photos: row.property_photos || []
      },
      tenant: {
        id: row.tenant_id,
        name: row.tenant_name,
        email: row.tenant_email
      },
      landlord: {
        id: row.landlord_id,
        name: row.landlord_name,
        email: row.landlord_email
      },
      offer: {
        id: row.offer_id,
        price: row.price,
        description: row.offer_description,
        availableAmenities: row.offer_amenities || []
      }
    } as Contract;
  }

  // Méthodes pour les réservations
  async createReservation(reservationData: CreateReservationData): Promise<Reservation> {
    const [newReservation] = await db
      .insert(reservations)
      .values({
        propertyId: reservationData.propertyId,
        tenantId: reservationData.tenantId,
        landlordId: reservationData.landlordId,
        startDate: new Date(reservationData.startDate),
        endDate: new Date(reservationData.endDate),
        totalPrice: reservationData.totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        specialRequests: reservationData.specialRequests,
      })
      .returning();

    // Créer une notification pour le propriétaire
    await this.createNotification(
      reservationData.landlordId,
      "reservation_requested",
      `Une nouvelle demande de réservation a été effectuée pour votre propriété.`,
      newReservation.id
    );

    return newReservation;
  }

  async getUserReservations(userId: number): Promise<Reservation[]> {
    // Récupérer les réservations où l'utilisateur est soit le locataire, soit le propriétaire
    const userReservations = await db
      .select()
      .from(reservations)
      .where(
        or(
          eq(reservations.tenantId, userId),
          eq(reservations.landlordId, userId)
        )
      );

    // Pour chaque réservation, récupérer les informations de la propriété et des utilisateurs
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

        // Retourner la réservation avec les détails supplémentaires
        return {
          ...reservation,
          property: property ? {
            id: property.id,
            title: property.title,
            address: property.address,
            photos: property.photos,
          } : null,
          tenant: tenant ? {
            id: tenant.id,
            name: tenant.username,
            email: tenant.email,
          } : null,
          landlord: landlord ? {
            id: landlord.id,
            name: landlord.username,
            email: landlord.email,
          } : null,
        };
      })
    );

    return detailedReservations;
  }

  async getReservationById(reservationId: number, userId: number): Promise<Reservation | null> {
    // Récupérer la réservation
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

    // Retourner la réservation avec les détails supplémentaires
    return {
      ...reservation,
      property: property ? {
        id: property.id,
        title: property.title,
        address: property.address,
        photos: property.photos,
      } : null,
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.username,
        email: tenant.email,
      } : null,
      landlord: landlord ? {
        id: landlord.id,
        name: landlord.username,
        email: landlord.email,
      } : null,
    };
  }

  async updateReservationStatus(reservationId: number, status: string, userId: number): Promise<Reservation> {
    // Vérifier que la réservation existe et appartient au propriétaire
    const [existingReservation] = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.id, reservationId),
          eq(reservations.landlordId, userId)
        )
      );

    if (!existingReservation) {
      throw new Error("Réservation non trouvée ou vous n'êtes pas autorisé à la modifier");
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

    // Créer une notification pour le locataire
    let notificationMessage = "";
    
    if (status === "confirmed") {
      notificationMessage = "Votre réservation a été confirmée par le propriétaire.";
    } else if (status === "cancelled") {
      notificationMessage = "Votre réservation a été annulée par le propriétaire.";
    } else if (status === "completed") {
      notificationMessage = "Votre séjour est terminé. Nous espérons que vous avez passé un agréable moment.";
    }
    
    if (notificationMessage) {
      await this.createNotification(
        existingReservation.tenantId,
        `reservation_${status}`,
        notificationMessage,
        reservationId
      );
    }

    return updatedReservation;
  }

  async updateReservationPaymentStatus(reservationId: number, paymentStatus: string, userId: number): Promise<Reservation> {
    // Vérifier que la réservation existe
    const [existingReservation] = await db
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

    if (!existingReservation) {
      throw new Error("Réservation non trouvée ou vous n'êtes pas autorisé à la modifier");
    }

    // Seul le locataire peut mettre à jour le statut de paiement
    if (existingReservation.tenantId !== userId) {
      throw new Error("Seul le locataire peut mettre à jour le statut de paiement");
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

    // Créer une notification pour le propriétaire
    let notificationMessage = "";
    
    if (paymentStatus === "paid") {
      notificationMessage = "Le paiement pour votre réservation a été effectué.";
    } else if (paymentStatus === "partially_paid") {
      notificationMessage = "Un paiement partiel a été effectué pour votre réservation.";
    }
    
    if (notificationMessage) {
      await this.createNotification(
        existingReservation.landlordId,
        `reservation_payment_${paymentStatus}`,
        notificationMessage,
        reservationId
      );
    }

    return updatedReservation;
  }
}

export const storage = new DatabaseStorage();