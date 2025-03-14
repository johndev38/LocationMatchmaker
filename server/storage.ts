import { IStorage } from "./types";
import type {
  User,
  InsertUser,
  RentalRequest,
  PropertyOffer,
  Message,
  Notification,
} from "@shared/schema";
import { users, rentalRequests, propertyOffers, messages, notifications, properties } from "@shared/schema";
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

  async getPropertyOffers(requestId: number): Promise<PropertyOffer[]> {
    return await db
      .select()
      .from(propertyOffers)
      .where(eq(propertyOffers.requestId, requestId));
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
    landlordId: number
  ): Promise<PropertyOffer> {
    const [offer] = await db
      .update(propertyOffers)
      .set({ status })
      .where(
        and(
          eq(propertyOffers.id, offerId),
          eq(propertyOffers.landlordId, landlordId)
        )
      )
      .returning();
    
    // Récupérer la demande associée à cette offre
    const [request] = await db
      .select()
      .from(rentalRequests)
      .where(eq(rentalRequests.id, offer.requestId));
    
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
    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    if (!property) {
      throw new Error("Property not found");
    }

    const updatedPhotos = [...(property.photos || []), photoUrl];
    
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
}

export const storage = new DatabaseStorage();