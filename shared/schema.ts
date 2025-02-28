import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isLandlord: boolean("is_landlord").notNull().default(false),
});

export const rentalRequests = pgTable("rental_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  location: text("location").notNull(),
  locationType: text("location_type").notNull(),
  maxDistance: integer("max_distance").notNull(),
  peopleCount: integer("people_count").notNull(),
  maxBudget: integer("max_budget").notNull(),
  status: text("status").notNull().default("active"),
});

export const propertyOffers = pgTable("property_offers", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  requestId: integer("request_id").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isLandlord: true,
});

export const locationTypes = [
  "ville",
  "montagne",
  "mer",
  "campagne",
  "ferme",
  "lac",
  "forêt",
] as const;

export const insertRentalRequestSchema = createInsertSchema(rentalRequests)
  .omit({
    id: true,
    userId: true,
    status: true,
  })
  .extend({
    locationType: z.enum(locationTypes),
  });

export const insertPropertyOfferSchema = createInsertSchema(propertyOffers).omit({
  id: true,
  landlordId: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RentalRequest = typeof rentalRequests.$inferSelect;
export type PropertyOffer = typeof propertyOffers.$inferSelect;
export type Message = typeof messages.$inferSelect;