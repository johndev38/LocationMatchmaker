import type { User, InsertUser, RentalRequest, PropertyOffer, Message } from "@shared/schema";
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
}
