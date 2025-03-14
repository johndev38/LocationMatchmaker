import { db } from "./db";
import { users, sessions, rentalRequests, propertyOffers, messages, notifications, properties } from "@shared/schema";

async function migrate() {
  console.log("Migrating database...");

  // Créer les tables si elles n'existent pas
  console.log("Creating users table...");
  await db.schema.createTable(users).ifNotExists().execute();

  console.log("Creating sessions table...");
  await db.schema.createTable(sessions).ifNotExists().execute();

  console.log("Creating rental_requests table...");
  await db.schema.createTable(rentalRequests).ifNotExists().execute();

  console.log("Creating property_offers table...");
  await db.schema.createTable(propertyOffers).ifNotExists().execute();

  console.log("Creating messages table...");
  await db.schema.createTable(messages).ifNotExists().execute();

  console.log("Creating notifications table...");
  await db.schema.createTable(notifications).ifNotExists().execute();

  console.log("Creating properties table...");
  await db.schema.createTable(properties).ifNotExists().execute();

  console.log("Migration completed!");
}

migrate().catch(console.error); 