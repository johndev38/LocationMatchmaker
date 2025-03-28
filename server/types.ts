import type { User, InsertUser, RentalRequest, PropertyOffer, Message, Notification, Reservation } from "@shared/schema";
import type { Store } from "express-session";

// Interface pour les données de contrat
export interface Contract {
  id: number;
  offerId: number;
  tenantId: number;
  landlordId: number;
  propertyId: number;
  price: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: number;
    title: string;
    address: string;
    photos?: string[];
  };
  tenant?: {
    id: number;
    name: string;
    email: string;
  };
  landlord?: {
    id: number;
    name: string;
    email: string;
  };
  offer?: {
    id: number;
    price: number;
    description: string;
    availableAmenities?: string[];
  };
}

// Interface pour les données d'entrée d'un contrat
export interface CreateContractData {
  offerId: number;
  tenantId: number;
  landlordId: number;
  price: number;
  propertyId: number;
  startDate: string | Date;
  endDate: string | Date;
}

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
  
  // Méthodes pour la gestion des contrats (redirigées vers les réservations)
  createContract(contractData: CreateReservationData): Promise<Reservation>;
  getUserContracts(userId: number): Promise<Reservation[]>;
  getContractById(contractId: number, userId: number): Promise<Reservation | null>;
  
  // Méthodes pour les réservations
  createReservation(reservationData: CreateReservationData): Promise<Reservation>;
  getUserReservations(userId: number): Promise<Reservation[]>;
  getReservationById(reservationId: number, userId: number): Promise<Reservation | null>;
  updateReservationStatus(reservationId: number, status: string, userId: number): Promise<Reservation>;
  updateReservationPaymentStatus(reservationId: number, paymentStatus: string, userId: number): Promise<Reservation>;
}

export interface CreateReservationData {
  propertyId: number;
  tenantId: number;
  landlordId: number;
  startDate: string | Date;
  endDate: string | Date;
  totalPrice: number;
  specialRequests?: string;
  offerId?: number;
}
