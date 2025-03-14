import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isLandlord: boolean("is_landlord").notNull().default(false),
  address: text("address"),
  phone: text("phone"),
  email: text("email").notNull().unique(),
});

// Définition de la table sessions pour l'authentification
export const sessions = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
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
  amenities: text("amenities").array(),
});

export const propertyOffers = pgTable("property_offers", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  requestId: integer("request_id").notNull(),
  price: integer("price").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"),
  availableAmenities: text("available_amenities").array(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  landlordId: integer("landlord_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  address: text("address").notNull(),
  photos: text("photos").array(),
  amenities: text("amenities").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'offer_received', 'offer_accepted', 'offer_rejected', etc.
  content: text("content").notNull(),
  relatedId: integer("related_id"), // ID de l'offre ou de la demande concernée
  isRead: boolean("is_read").notNull().default(false),
  timestamp: text("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isLandlord: true,
  address: true,
  phone: true,
  email: true,
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

export const amenities = [
  "climatisation",
  "piscine",
  "vue_mer",
  "vue_montagne",
  "calme",
  "jardin",
  "terrasse",
  "parking",
  "wifi",
  "television",
  "lave_linge",
  "lave_vaisselle",
  "barbecue",
  "jacuzzi",
  "sauna",
  "salle_sport",
  "ascenseur",
  "accessible_handicap",
  "animaux_acceptes",
  "proche_commerces",
  "proche_transports",
  "proche_plage",
  "proche_ski",
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
    amenities: z.array(z.enum(amenities)).optional(),
  });

export const insertPropertyOfferSchema = createInsertSchema(propertyOffers).omit({
  id: true,
  landlordId: true,
  status: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  landlordId: true,
  createdAt: true,
  updatedAt: true,
});

export const updatePropertySchema = createInsertSchema(properties).omit({
  id: true,
  landlordId: true,
  createdAt: true, 
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RentalRequest = typeof rentalRequests.$inferSelect;
export type PropertyOffer = typeof propertyOffers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;