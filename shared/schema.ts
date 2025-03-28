import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// Nouvelle table pour les réservations
export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  landlordId: integer("landlord_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalPrice: integer("total_price").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled, completed
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid, partially_paid, paid
  specialRequests: text("special_requests"),
  offerId: integer("offer_id"), // Ajout d'un champ pour lier à une offre (si applicable)
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
  type: text("type").notNull(), // 'offer_received', 'offer_accepted', 'offer_rejected', 'reservation_requested', 'reservation_confirmed', etc.
  content: text("content").notNull(),
  relatedId: integer("related_id"), // ID de l'offre, la demande ou la réservation concernée
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

export const reservationStatuses = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
] as const;

export const paymentStatuses = [
  "unpaid",
  "partially_paid",
  "paid",
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

export const insertReservationSchema = createInsertSchema(reservations)
  .omit({
    id: true,
    status: true,
    paymentStatus: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    startDate: z.date(),
    endDate: z.date().refine(date => date >= new Date(), "La date de fin doit être dans le futur"),
    specialRequests: z.string().optional(),
    offerId: z.number().optional(),
  });

export const updateReservationSchema = createInsertSchema(reservations)
  .omit({
    id: true,
    propertyId: true,
    tenantId: true,
    landlordId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    status: z.enum(reservationStatuses),
    paymentStatus: z.enum(paymentStatuses),
    startDate: z.date().optional(),
    endDate: z.date().optional().refine(
      (date) => {
        if (!date) return true;
        if (date >= new Date()) return true;
        return false;
      }, 
      "La date de fin doit être dans le futur"
    ),
    specialRequests: z.string().optional(),
  });

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  timestamp: true,
});

// Relations pour les réservations
export const reservationsRelations = relations(reservations, ({ one }) => ({
  property: one(properties, {
    fields: [reservations.propertyId],
    references: [properties.id],
  }),
  tenant: one(users, {
    fields: [reservations.tenantId],
    references: [users.id],
    relationName: "tenant",
  }),
  landlord: one(users, {
    fields: [reservations.landlordId],
    references: [users.id],
    relationName: "landlord",
  }),
}));

// Relations pour les propriétés
export const propertiesRelations = relations(properties, ({ one }) => ({
  landlord: one(users, {
    fields: [properties.landlordId],
    references: [users.id],
  }),
}));

// Relations pour les offres de propriété
export const propertyOffersRelations = relations(propertyOffers, ({ one }) => ({
  landlord: one(users, {
    fields: [propertyOffers.landlordId],
    references: [users.id],
  }),
  request: one(rentalRequests, {
    fields: [propertyOffers.requestId],
    references: [rentalRequests.id],
  }),
}));

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type RentalRequest = typeof rentalRequests.$inferSelect;
export type PropertyOffer = typeof propertyOffers.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type UpdateReservation = z.infer<typeof updateReservationSchema>;