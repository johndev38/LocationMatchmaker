import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
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
  departureCity: text("departure_city").notNull(),
  locationType: text("location_type").array().notNull(),
  maxDistance: integer("max_distance").notNull(),
  adults: integer("adults").notNull(),
  children: integer("children").notNull(),
  babies: integer("babies").notNull(),
  pets: integer("pets").notNull(),
  maxBudget: integer("max_budget").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
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
    locationType: z.array(z.enum(locationTypes)).min(1, "Sélectionnez au moins un type de destination"),
    departureCity: z.string().nonempty("La ville de départ est requise"),
    maxDistance: z.number().min(1, "La distance maximale doit être supérieure à 0"),
    adults: z.number().min(0, "Le nombre d'adultes doit être au moins 0"),
    children: z.number().min(0, "Le nombre d'enfants doit être au moins 0"),
    babies: z.number().min(0, "Le nombre de bébés doit être au moins 0"),
    pets: z.number().min(0, "Le nombre d'animaux doit être au moins 0"),
    maxBudget: z.number().min(1, "Le budget maximum doit être supérieur à 0"),
    startDate: z.date(),
    endDate: z.date().refine(date => date >= new Date(), "La date de fin doit être dans le futur"),
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