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
    try {
      // Vérifier s'il existe déjà un contrat actif pour cette propriété
      const existingContracts = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.propertyId, contractData.propertyId),
            eq(contracts.status, 'active')
          )
        );
      
      if (existingContracts.length > 0) {
        throw new Error("Cette propriété est déjà sous contrat. Impossible d'en créer un nouveau.");
      }
      
      // S'assurer que les dates sont des chaînes ISO
      const startDate = typeof contractData.startDate === 'string' 
        ? contractData.startDate 
        : contractData.startDate.toISOString();
        
      const endDate = typeof contractData.endDate === 'string' 
        ? contractData.endDate 
        : contractData.endDate.toISOString();
      
      console.log("Insertion d'un contrat avec les données suivantes:", {
        ...contractData,
        startDate,
        endDate
      });
      
      // Utiliser une approche plus robuste avec insertion directe sur la table contracts
      const [contract] = await db
        .insert(contracts)
        .values({
          offerId: contractData.offerId,
          tenantId: contractData.tenantId,
          landlordId: contractData.landlordId,
          price: contractData.price,
          propertyId: contractData.propertyId,
          startDate,
          endDate,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      if (!contract) {
        throw new Error("Erreur lors de la création du contrat - aucun contrat retourné");
      }
      
      console.log("Contrat créé avec succès:", contract);
      
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
      
      return contract as unknown as Contract;
    } catch (error) {
      console.error("Erreur lors de la création du contrat:", error);
      throw new Error(`Erreur lors de la création du contrat: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Récupérer tous les contrats d'un utilisateur
  async getUserContracts(userId: number): Promise<Contract[]> {
    console.log("Récupération des contrats pour l'utilisateur:", userId);
    
    try {
      // Utiliser la syntaxe ORM Drizzle standard au lieu de SQL brut
      const userContracts = await db
        .select()
        .from(contracts)
        .where(
          or(
            eq(contracts.tenantId, userId),
            eq(contracts.landlordId, userId)
          )
        )
        .orderBy(contracts.createdAt, "desc");
      
      console.log("Nombre de contrats trouvés:", userContracts.length);
      
      // Pour chaque contrat, récupérer les informations liées
      const detailedContracts = await Promise.all(
        userContracts.map(async (contract) => {
          // Récupérer les détails de la propriété
          const [property] = await db
            .select()
            .from(properties)
            .where(eq(properties.id, contract.propertyId));
          
          // Récupérer les informations du locataire
          const [tenant] = await db
            .select()
            .from(users)
            .where(eq(users.id, contract.tenantId));
          
          if (!tenant) {
            console.warn(`Locataire (ID: ${contract.tenantId}) non trouvé dans la base de données.`);
          } else {
            console.log(`Locataire trouvé: ${tenant.username} (ID: ${tenant.id})`);
          }
          
          // Récupérer les informations du propriétaire
          console.log(`Tentative de récupération du propriétaire avec ID: ${contract.landlordId}`);
          
          // Vérifions tous les utilisateurs pour déboguer
          const allUsers = await db.select().from(users);
          console.log("Tous les utilisateurs disponibles:", allUsers.map(u => ({ id: u.id, username: u.username })));
          
          const [landlord] = await db
            .select()
            .from(users)
            .where(eq(users.id, contract.landlordId));
          
          if (!landlord) {
            console.warn(`Propriétaire (ID: ${contract.landlordId}) non trouvé dans la base de données.`);
          } else {
            console.log(`Propriétaire trouvé: ${landlord.username} (ID: ${landlord.id})`);
          }
          
          // Récupérer les détails de l'offre
          const [offer] = await db
            .select()
            .from(propertyOffers)
            .where(eq(propertyOffers.id, contract.offerId));
          
          // Retourner le contrat avec les détails
          return {
            ...contract,
            // Convertir explicitement les dates en string
            createdAt: contract.createdAt ? contract.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: contract.updatedAt ? contract.updatedAt.toISOString() : new Date().toISOString(),
            startDate: contract.startDate || new Date().toISOString(),
            endDate: contract.endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            property: property ? {
              id: property.id,
              title: property.title,
              address: property.address,
              photos: property.photos || []
            } : {
              id: contract.propertyId,
              title: "Propriété inconnue",
              address: "Adresse non disponible",
              photos: []
            },
            tenant: tenant ? {
              id: tenant.id,
              name: tenant.username,
              email: tenant.email
            } : {
              id: contract.tenantId,
              name: "Utilisateur inconnu",
              email: "Non disponible"
            },
            landlord: landlord ? {
              id: landlord.id,
              name: landlord.username,
              email: landlord.email
            } : {
              id: contract.landlordId,
              name: "Propriétaire inconnu",
              email: "Non disponible"  
            },
            offer: offer ? {
              id: offer.id,
              price: contract.price,
              description: offer.description || "",
              availableAmenities: offer.availableAmenities || []
            } : null
          } as unknown as Contract;
        })
      );
      
      console.log("Contrats détaillés récupérés");
      return detailedContracts;
    } catch (error) {
      console.error("Erreur lors de la récupération des contrats:", error);
      return [];
    }
  }

  // Récupérer un contrat spécifique
  async getContractById(contractId: number, userId: number): Promise<Contract | null> {
    console.log("Récupération du contrat", contractId, "pour l'utilisateur", userId);
    
    try {
      // Utiliser la syntaxe ORM Drizzle standard au lieu de SQL brut
      const [contract] = await db
        .select()
        .from(contracts)
        .where(
          and(
            eq(contracts.id, contractId),
            or(
              eq(contracts.tenantId, userId),
              eq(contracts.landlordId, userId)
            )
          )
        );
      
      if (!contract) {
        return null;
      }
      
      // Récupérer les détails de la propriété
      const [property] = await db
        .select()
        .from(properties)
        .where(eq(properties.id, contract.propertyId));
      
      // Récupérer les informations du locataire
      const [tenant] = await db
        .select()
        .from(users)
        .where(eq(users.id, contract.tenantId));
      
      // Récupérer les informations du propriétaire
      const [landlord] = await db
        .select()
        .from(users)
        .where(eq(users.id, contract.landlordId));
      
      // Récupérer les détails de l'offre
      const [offer] = await db
        .select()
        .from(propertyOffers)
        .where(eq(propertyOffers.id, contract.offerId));
      
      // Retourner le contrat avec les détails
      return {
        ...contract,
        // Convertir explicitement les dates en string
        createdAt: contract.createdAt ? contract.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: contract.updatedAt ? contract.updatedAt.toISOString() : new Date().toISOString(),
        startDate: contract.startDate || new Date().toISOString(),
        endDate: contract.endDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        property: property ? {
          id: property.id,
          title: property.title,
          address: property.address,
          photos: property.photos || []
        } : {
          id: contract.propertyId,
          title: "Propriété inconnue",
          address: "Adresse non disponible",
          photos: []
        },
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.username,
          email: tenant.email
        } : {
          id: contract.tenantId,
          name: "Utilisateur inconnu",
          email: "Non disponible"
        },
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.username,
          email: landlord.email
        } : {
          id: contract.landlordId,
          name: "Propriétaire inconnu",
          email: "Non disponible"  
        },
        offer: offer ? {
          id: offer.id,
          price: contract.price,
          description: offer.description || "",
          availableAmenities: offer.availableAmenities || []
        } : {
          id: contract.offerId,
          price: contract.price,
          description: "Aucune description disponible",
          availableAmenities: []
        }
      } as unknown as Contract;
    } catch (error) {
      console.error("Erreur lors de la récupération du contrat:", error);
      return null;
    }
  }

  // Méthodes pour les réservations
  async createReservation(reservationData: CreateReservationData): Promise<Reservation> {
    try {
      // Vérifier que le landlord existe
      const landlord = await db.query.users.findFirst({
        where: eq(users.id, reservationData.landlordId),
      });

      if (!landlord) {
        throw new Error(`Propriétaire (ID: ${reservationData.landlordId}) non trouvé dans la base de données`);
      }

      // Vérifier que la propriété existe
      const property = await db.query.properties.findFirst({
        where: eq(properties.id, reservationData.propertyId),
      });

      if (!property) {
        throw new Error(`Propriété (ID: ${reservationData.propertyId}) non trouvée dans la base de données`);
      }

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
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Créer une notification pour le propriétaire
      await this.createNotification({
        userId: reservationData.landlordId,
        type: "reservation_requested",
        content: `Une nouvelle demande de réservation a été reçue`,
        relatedId: newReservation.id,
        timestamp: new Date().toISOString(),
      });

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
        orderBy: (reservations) => desc(reservations.createdAt),
      });

      return userReservations;
    } catch (error) {
      console.error("Erreur lors de la récupération des réservations:", error);
      throw error;
    }
  }

  async getReservationById(reservationId: number, userId: number): Promise<Reservation | null> {
    try {
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

      return reservation;
    } catch (error) {
      console.error("Erreur lors de la récupération de la réservation:", error);
      throw error;
    }
  }

  async updateReservationStatus(reservationId: number, status: string, userId: number): Promise<Reservation> {
    try {
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
      await this.createNotification({
        userId: reservation.tenantId,
        type: `reservation_${status}`,
        content: `Votre réservation a été ${status === "confirmed" ? "confirmée" : status === "cancelled" ? "annulée" : "mise à jour"}`,
        relatedId: reservationId,
        timestamp: new Date().toISOString(),
      });

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

  async updateReservationPaymentStatus(reservationId: number, paymentStatus: string, userId: number): Promise<Reservation> {
    try {
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
        throw new Error("Réservation non trouvée ou vous n'êtes pas autorisé à la modifier");
      }

      // Mettre à jour le statut
      const [updatedReservation] = await db
        .update(reservations)
        .set({ 
          paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(reservations.id, reservationId))
        .returning();

      // Créer une notification pour le propriétaire
      await this.createNotification({
        userId: reservation.landlordId,
        type: `payment_${paymentStatus}`,
        content: `Le paiement de la réservation est maintenant ${paymentStatus === "paid" ? "payé" : paymentStatus === "partially_paid" ? "partiellement payé" : "non payé"}`,
        relatedId: reservationId,
        timestamp: new Date().toISOString(),
      });

      const result = await this.getReservationById(reservationId, userId);
      if (!result) {
        throw new Error(`Impossible de récupérer la réservation mise à jour avec l'ID ${reservationId}`);
      }
      return result;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut de paiement de la réservation:", error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      return user;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();