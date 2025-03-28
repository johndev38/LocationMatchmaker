import React from "react";
import { apiRequest } from "../utils/api";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../utils/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Reservation {
  id: number;
  propertyId: number;
  tenantId: number;
  landlordId: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  specialRequests?: string;
  offerId?: number;
  createdAt: string;
  updatedAt: string;
  property?: {
    id: number;
    title: string;
    address: string;
    photos?: string[];
    amenities?: string[];
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

export default function ReservationsPage() {
  const { user } = useAuth();

  // Récupérer toutes les réservations de l'utilisateur
  const { data: reservations = [], isLoading, error } = useQuery({
    queryKey: ["userReservations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/reservations");
      if (!response.ok) throw new Error("Erreur lors de la récupération des réservations");
      return response.json();
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Regrouper les réservations par statut
  const activeReservations = reservations.filter((r: Reservation) => 
    r.status === "pending" || r.status === "confirmed"
  );
  const pastReservations = reservations.filter((r: Reservation) => 
    r.status === "completed" || r.status === "cancelled"
  );

  // Fonction pour afficher le statut lisible 
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "confirmed": return "Confirmée";
      case "cancelled": return "Annulée";
      case "completed": return "Terminée";
      default: return status;
    }
  };

  const getPaymentStatusDisplay = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "unpaid": return "Non payée";
      case "partially_paid": return "Partiellement payée";
      case "paid": return "Payée";
      default: return paymentStatus;
    }
  };

  if (isLoading) {
    return <div className="container max-w-4xl mx-auto p-6">
      <Skeleton className="h-12 w-64 mb-6" />
      <Skeleton className="h-8 w-full mb-4" />
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>;
  }

  if (error) {
    return <div className="container max-w-4xl mx-auto p-6">
      <p>Une erreur s'est produite lors de la récupération de vos réservations.</p>
      <p className="text-sm text-gray-500">{(error as Error).message}</p>
    </div>;
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mes réservations</h1>
        <p className="text-gray-600">
          Consultez vos réservations de location actives et passées
        </p>
        <div className="mt-3 bg-blue-50 p-3 rounded-md">
          <p>Suivez l'état de vos réservations et accédez aux détails importants comme les dates, le prix et les informations sur le propriétaire ou le locataire.</p>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-4">
          <TabsTrigger value="active">Réservations actives ({activeReservations.length})</TabsTrigger>
          <TabsTrigger value="past">Réservations passées ({pastReservations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeReservations.length === 0 ? (
            <Card className="p-6 text-center bg-white shadow-sm">
              <div className="p-6">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune réservation active</h3>
                <p className="text-gray-600">
                  Vous n'avez pas encore de réservations actives. Explorez les propriétés disponibles pour faire une réservation.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {activeReservations.map((reservation: Reservation) => {
                // Vérifier si toutes les informations essentielles sont présentes
                if (!reservation.property || !reservation.property.title) {
                  return (
                    <Card key={reservation.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
                      <CardHeader className="bg-gray-50 pb-2">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {reservation.property?.title || "Propriété"}
                        </CardTitle>
                        <div className="bg-yellow-50 p-3 rounded-md mt-2">
                          <p className="text-sm text-yellow-800">
                            Certaines informations de cette réservation sont manquantes
                          </p>
                          <p>Nous ne pouvons pas afficher tous les détails de cette réservation car certaines informations sont manquantes.</p>
                          <p>Identifiant de la réservation: {reservation.id}</p>
                          <p>Prix: {reservation.totalPrice} €</p>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                }

                console.log("Réservation:", reservation);
                console.log("ID propriétaire dans la réservation:", reservation.landlordId);
                console.log("Objet propriétaire:", reservation.landlord);
                console.log("Objet locataire:", reservation.tenant);
                
                const isLandlord = user?.id === reservation.landlordId;
                const otherParty = isLandlord ? reservation.tenant : reservation.landlord;

                return (
                  <Card key={reservation.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="bg-gray-50 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {reservation.property?.title || "Propriété"}
                        </CardTitle>
                        <div className="flex flex-col items-end">
                          <p className="text-sm text-gray-600">{reservation.property?.address || "Adresse non disponible"}</p>
                          
                          <div className="flex items-center mt-2">
                            <p className="text-2xl font-bold text-pink-600">{reservation.totalPrice} €</p>
                            <div className={`ml-3 px-2 py-1 rounded-md text-xs font-medium ${
                              reservation.status === "confirmed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {getStatusDisplay(reservation.status)}
                            </div>
                            <div className={`ml-1 px-2 py-1 rounded-md text-xs font-medium ${
                              reservation.paymentStatus === "paid" 
                                ? "bg-green-100 text-green-800" 
                                : reservation.paymentStatus === "partially_paid"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}>
                              {getPaymentStatusDisplay(reservation.paymentStatus)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Informations sur la réservation</p>
                          
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-gray-500">Dates</Label>
                              <p className="text-sm text-gray-600">
                                {new Date(reservation.startDate).toLocaleDateString('fr-FR')} - {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Prix total</Label>
                              <p className="text-sm text-gray-600">{reservation.totalPrice} €</p>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Propriété</Label>
                              <p className="text-sm text-gray-600">{reservation.property?.title || "Propriété"}</p>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-500">Adresse</Label>
                              <p className="text-sm text-gray-600">{reservation.property?.address || "Adresse non disponible"}</p>
                            </div>

                            {reservation.specialRequests && (
                              <div>
                                <Label className="text-xs text-gray-500">Demandes spéciales</Label>
                                <p className="text-sm text-gray-600">{reservation.specialRequests}</p>
                              </div>
                            )}
                            
                            <div>
                              <Label className="text-xs text-gray-500">{isLandlord ? "Locataire" : "Propriétaire"}</Label>
                              <p className="text-sm text-gray-600">
                                {otherParty?.name || "Non disponible"} 
                                ({otherParty?.email || "Email non disponible"})
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {reservation.property?.photos && reservation.property.photos.length > 0 && (
                            <div className="mb-4">
                              <img 
                                src={reservation.property.photos[0]} 
                                alt={reservation.property.title} 
                                className="w-full h-32 object-cover rounded-md"
                              />
                            </div>
                          )}
                          
                          {reservation.property?.amenities && reservation.property.amenities.length > 0 && (
                            <div className="mb-4">
                              <Label className="text-xs text-gray-500">Équipements</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {reservation.property.amenities.map((amenity: string) => (
                                  <span 
                                    key={amenity}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                                  >
                                    {amenity.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {reservation.offer?.description && (
                            <div className="mb-4">
                              <Label className="text-xs text-gray-500">Description de l'offre</Label>
                              <p className="text-gray-700">{reservation.offer?.description || "Aucune description disponible"}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-sm text-gray-500">Réservation créée le {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
                        
                        <div className="flex items-center">
                          <Info className="h-4 w-4" /> Détails de la réservation
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastReservations.length === 0 ? (
            <Card className="p-6 text-center bg-white shadow-sm">
              <div className="p-6">
                <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune réservation passée</h3>
                <p className="text-gray-600">
                  Votre historique de réservations est vide.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pastReservations.map((reservation: Reservation) => {
                const isLandlord = user?.id === reservation.landlordId;
                const otherParty = isLandlord ? reservation.tenant : reservation.landlord;

                return (
                  <Card key={reservation.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all opacity-75">
                    <CardHeader className="bg-gray-50 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold text-gray-800">
                          {reservation.property?.title || "Propriété"}
                        </CardTitle>
                        <div className="flex flex-col items-end">
                          <p className="text-sm text-gray-600">{reservation.property?.address || "Adresse non disponible"}</p>
                          
                          <div className="flex items-center mt-2">
                            <p className="text-xl font-semibold text-gray-600">{reservation.totalPrice} €</p>
                            <div className={`ml-3 px-2 py-1 rounded-md text-xs font-medium ${
                              reservation.status === "completed" 
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}>
                              {getStatusDisplay(reservation.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500">Dates</Label>
                          <p className="text-sm text-gray-600">
                            {new Date(reservation.startDate).toLocaleDateString('fr-FR')} - {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                          </p>
                          
                          <div className="mt-2">
                            <Label className="text-xs text-gray-500">{isLandlord ? "Locataire" : "Propriétaire"}</Label>
                            <p className="text-sm text-gray-600">
                              {otherParty?.name || "Non disponible"}
                            </p>
                          </div>
                        </div>
                        
                        {reservation.property?.photos && reservation.property.photos.length > 0 && (
                          <div>
                            <img 
                              src={reservation.property.photos[0]} 
                              alt={reservation.property.title} 
                              className="w-full h-24 object-cover rounded-md opacity-75"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs text-gray-400">Réservation {reservation.status === "completed" ? "terminée" : "annulée"} le {new Date(reservation.updatedAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 