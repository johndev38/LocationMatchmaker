import { IStorage } from "./types";
import type {
  User,
  InsertUser,
  RentalRequest,
  PropertyOffer,
  Message,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rentalRequests: Map<number, RentalRequest>;
  private propertyOffers: Map<number, PropertyOffer>;
  private messages: Map<number, Message>;
  private currentId: { [key: string]: number };
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.rentalRequests = new Map();
    this.propertyOffers = new Map();
    this.messages = new Map();
    this.currentId = {
      users: 1,
      rentalRequests: 1,
      propertyOffers: 1,
      messages: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async createRentalRequest(userId: number, request: Omit<RentalRequest, "id" | "userId" | "status">): Promise<RentalRequest> {
    const id = this.currentId.rentalRequests++;
    const rentalRequest = {
      id,
      userId,
      status: "active",
      ...request,
    };
    this.rentalRequests.set(id, rentalRequest);
    return rentalRequest;
  }

  async getRentalRequests(): Promise<RentalRequest[]> {
    return Array.from(this.rentalRequests.values());
  }

  async createPropertyOffer(landlordId: number, offer: Omit<PropertyOffer, "id" | "landlordId" | "status">): Promise<PropertyOffer> {
    const id = this.currentId.propertyOffers++;
    const propertyOffer = {
      id,
      landlordId,
      status: "pending",
      ...offer,
    };
    this.propertyOffers.set(id, propertyOffer);
    return propertyOffer;
  }

  async getPropertyOffers(requestId: number): Promise<PropertyOffer[]> {
    return Array.from(this.propertyOffers.values()).filter(
      (offer) => offer.requestId === requestId,
    );
  }

  async createMessage(message: Omit<Message, "id" | "timestamp">): Promise<Message> {
    const id = this.currentId.messages++;
    const newMessage = {
      id,
      timestamp: new Date().toISOString(),
      ...message,
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) =>
        message.senderId === userId || message.receiverId === userId,
    );
  }
}

export const storage = new MemStorage();
