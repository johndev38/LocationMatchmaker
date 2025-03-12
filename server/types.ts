import type { User, InsertUser, RentalRequest, PropertyOffer, Message, Notification } from "@shared/schema";
import type { Store } from "express-session";

export interface IStorage {
  sessionStore: Store;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createRentalRequest(userId: number, request: Omit<RentalRequest, "id" | "userId" | "status">): Promise<RentalRequest>;
  getRentalRequests(): Promise<RentalRequest[]>;
  createPropertyOffer(landlordId: number, offer: Omit<PropertyOffer, "id" | "landlordId" | "status">): Promise<PropertyOffer>;
  getPropertyOffers(requestId: number): Promise<PropertyOffer[]>;
  createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message>;
  getMessages(userId: number): Promise<Message[]>;
  getUserListings(userId: number): Promise<RentalRequest[]>;
  deleteRentalRequest(requestId: number, userId: number): Promise<void>;
  updateUser(id: number, data: { name: string; email: string; address: string; phone: string }): Promise<User>;
  
  // Nouvelles méthodes pour les notifications
  createNotification(userId: number, type: string, content: string, relatedId?: number): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<Notification>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Nouvelles méthodes pour la gestion des offres
  updatePropertyOfferStatus(offerId: number, status: string, landlordId: number): Promise<PropertyOffer>;
  getLandlordOffers(landlordId: number): Promise<PropertyOffer[]>;
  createPropertyOfferWithNotification(landlordId: number, offer: Omit<PropertyOffer, "id" | "landlordId" | "status">): Promise<PropertyOffer>;
}
