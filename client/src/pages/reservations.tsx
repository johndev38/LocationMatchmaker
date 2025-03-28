import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Header from "./header";
import { Loader2, Home, User, Calendar, Euro, CheckCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
  createdAt: string;
  property: {
    id: number;
    title: string;
    address: string;
    photos?: string[];
  };
  tenant: {
    id: number;
    name: string;
    email: string;
  };
  landlord: {
    id: number;
    name: string;
    email: string;
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
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            <p>Une erreur s'est produite lors de la récupération de vos réservations.</p>
            <p className="text-sm mt-2">Message d'erreur: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Fonction pour formater le statut
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'cancelled': return 'Annulée';
      case 'completed': return 'Terminée';
      default: return status;
    }
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour formater le statut de paiement
  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'unpaid': return 'Non payé';
      case 'partially_paid': return 'Partiellement payé';
      case 'paid': return 'Payé';
      default: return status;
    }
  };

  // Fonction pour obtenir la couleur du badge en fonction du statut de paiement
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mes réservations</h1>
            <p className="text-gray-500 mt-1">
              Consultez et gérez vos réservations de location
            </p>
          </div>
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="bg-pink-50 inline-flex rounded-full p-4 mb-4">
                <Info className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune réservation</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Vous n'avez pas encore de réservations. Faites une demande de location pour créer une réservation.
              </p>
              <Button asChild className="bg-pink-600 hover:bg-pink-700">
                <a href="/searchLocations" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Rechercher un logement
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {reservations.map((reservation: Reservation) => {
              const isLandlord = user?.id === reservation.landlordId;
              const otherParty = isLandlord ? reservation.tenant : reservation.landlord;
              
              return (
                <Card key={reservation.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          {reservation.property?.title || "Propriété"}
                        </CardTitle>
                        <p className="text-gray-600 text-sm mt-1">{reservation.property?.address || "Adresse non disponible"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pink-600">{reservation.totalPrice} €</p>
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(reservation.status)}>
                            {formatStatus(reservation.status)}
                          </Badge>
                          <Badge className={getPaymentStatusColor(reservation.paymentStatus)}>
                            {formatPaymentStatus(reservation.paymentStatus)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Informations sur la réservation</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Période</p>
                              <p className="text-sm text-gray-600">
                                {new Date(reservation.startDate).toLocaleDateString('fr-FR')} - {new Date(reservation.endDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Prix total</p>
                              <p className="text-sm text-gray-600">{reservation.totalPrice} €</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Propriété</p>
                              <p className="text-sm text-gray-600">{reservation.property?.title || "Propriété"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Adresse</p>
                              <p className="text-sm text-gray-600">{reservation.property?.address || "Adresse non disponible"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-2">Informations sur {isLandlord ? "le locataire" : "le propriétaire"}</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Nom</p>
                              <p className="text-sm text-gray-600">{otherParty?.name || "Non disponible"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-gray-600">{otherParty?.email || "Non disponible"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Rôle</p>
                              <p className="text-sm text-gray-600">{isLandlord ? "Locataire" : "Propriétaire"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {reservation.specialRequests && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Demandes spéciales</p>
                        <p className="text-gray-700">{reservation.specialRequests}</p>
                      </div>
                    )}
                  </CardContent>

                  <Separator />

                  <CardFooter className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Réservation créée le {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex gap-2">
                      {isLandlord && reservation.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" className="bg-green-50 text-green-600 hover:bg-green-100">
                            Confirmer
                          </Button>
                          <Button variant="outline" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100">
                            Annuler
                          </Button>
                        </>
                      )}
                      {!isLandlord && reservation.status === 'confirmed' && reservation.paymentStatus === 'unpaid' && (
                        <Button variant="outline" size="sm" className="bg-blue-50 text-blue-600 hover:bg-blue-100">
                          Payer
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Info className="h-4 w-4" /> Détails
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 