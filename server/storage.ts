import { IStorage } from "./types";
import type {
  User,
  InsertUser,
  RentalRequest,
  PropertyOffer,
  Message,
} from "@shared/schema";
import { users, rentalRequests, propertyOffers, messages } from "@shared/schema";
import { eq } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
    return user;
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
        locationType: request.locationType,
        maxDistance: request.maxDistance,
        maxBudget: request.maxBudget,
        startDate: request.startDate,
        endDate: request.endDate,
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
      .where(eq(rentalRequests.id, requestId) && eq(rentalRequests.userId, userId));
  }
}

export const storage = new DatabaseStorage();