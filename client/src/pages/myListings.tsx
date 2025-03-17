import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Calendar, Users, Ruler, Euro, Trash2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";

interface Property {
  title?: string;
  address: string;
  photos?: string[];
}

interface Offer {
  id: number;
  requestId: number;
  property?: Property;
  status: 'pending' | 'accepted' | 'rejected';
  price: number;
  description: string;
  availableAmenities?: string[];
}

export default function MyListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Récupérer les annonces de l'utilisateur
  const { data: userListings = [], isLoading: loadingListings } = useQuery({
    queryKey: ["userListings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/my-listings");
      if (!response.ok) throw new Error("Erreur lors de la récupération des annonces");
      return response.json();
    },
    enabled: !!user,
  });

  // Récupérer toutes les offres pour toutes les demandes
  const { data: allPropertyOffers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ["allPropertyOffers"],
    queryFn: async () => {
      const allOffers = await Promise.all(
        userListings.map(async (listing: any) => {
          const response = await apiRequest("GET", `/api/property-offers/${listing.id}`);
          if (!response.ok) return [];
          const offers = await response.json();
          return offers.map((offer: any) => ({ ...offer, requestId: listing.id }));
        })
      );
      return allOffers.flat();
    },
    enabled: userListings.length > 0,
  });

  // Mutation pour mettre à jour le statut d'une offre
  const updateOfferStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/property-offers/${offerId}/status`, {
        status,
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut de l'offre");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allPropertyOffers"] });
      toast({
        title: "Offre mise à jour",
        description: "Le statut de l'offre a été mis à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'offre : " + error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation pour supprimer une demande
  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("DELETE", `/api/rental-requests/${requestId}`);
      if (!response.ok) throw new Error("Erreur lors de la suppression de la demande");
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userListings"] });
      toast({
        title: "Demande supprimée",
        description: "Votre demande a été supprimée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la demande : " + error.message,
        variant: "destructive",
      });
    },
  });

  if (loadingListings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mes demandes de location</h1>
          <Button asChild>
            <a href="/create-request">Nouvelle demande</a>
          </Button>
        </div>

        {userListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de demande de location</p>
            <p className="text-gray-400 mb-6">Créez votre première demande pour recevoir des offres de propriétaires</p>
            <Button asChild>
              <a href="/create-request">Créer une demande</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {userListings.map((listing: any) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  {/* En-tête de la demande */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-pink-500" />
                        {listing.departureCity}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(listing.startDate).toLocaleDateString('fr-FR')} - {new Date(listing.endDate).toLocaleDateString('fr-FR')}
                        </span>
                        <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                          {listing.status}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
                          deleteRequestMutation.mutate(listing.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Détails de la demande */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Voyageurs
                      </p>
                      <p className="mt-1">
                        {listing.adults} adultes
                        {listing.children > 0 && `, ${listing.children} enfants`}
                        {listing.babies > 0 && `, ${listing.babies} bébés`}
                        {listing.pets > 0 && `, ${listing.pets} animaux`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Ruler className="h-4 w-4" /> Distance max
                      </p>
                      <p className="mt-1">{listing.maxDistance} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Euro className="h-4 w-4" /> Budget max
                      </p>
                      <p className="mt-1">{listing.maxBudget} €</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Type de location</p>
                      <p className="mt-1">{listing.locationType.join(", ")}</p>
                    </div>
                  </div>

                  {/* Prestations souhaitées */}
                  {listing.amenities && listing.amenities.length > 0 && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-500 mb-2">Prestations souhaitées</p>
                      <div className="flex flex-wrap gap-2">
                        {listing.amenities.map((amenity: string) => (
                          <Badge 
                            key={amenity}
                            variant="outline"
                            className="capitalize"
                          >
                            {amenity.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Section des offres reçues */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Offres reçues</h3>
                    {loadingOffers ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allPropertyOffers
                          .filter((offer: Offer) => offer.requestId === listing.id)
                          .map((offer: Offer) => (
                            <Card key={offer.id} className="overflow-hidden">
                              {/* Carrousel de photos */}
                              {offer.property?.photos && offer.property.photos.length > 0 ? (
                                <div className="relative h-64">
                                  <Carousel className="w-full">
                                    <CarouselContent>
                                      {offer.property.photos.map((photo: string, index: number) => (
                                        <CarouselItem key={index}>
                                          <div className="h-64 w-full relative">
                                            <img
                                              src={photo}
                                              alt={`Photo ${index + 1}`}
                                              className="w-full h-full object-cover rounded-t-lg"
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
                                              {index + 1}/{offer.property?.photos?.length}
                                            </div>
                                          </div>
                                        </CarouselItem>
                                      ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </Carousel>
                                </div>
                              ) : (
                                <div className="h-64 bg-gray-100 flex items-center justify-center rounded-t-lg">
                                  <p className="text-gray-400">Aucune photo disponible</p>
                                </div>
                              )}

                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <h4 className="font-semibold">{offer.property?.title || 'Sans titre'}</h4>
                                    <p className="text-sm text-gray-600">{offer.property?.address}</p>
                                  </div>
                                  <Badge
                                    variant={
                                      offer.status === "pending" ? "secondary" :
                                      offer.status === "accepted" ? "default" :
                                      "destructive"
                                    }
                                  >
                                    {offer.status === "pending" ? "En attente" :
                                     offer.status === "accepted" ? "Acceptée" :
                                     "Refusée"}
                                  </Badge>
                                </div>

                                <p className="text-xl font-semibold text-pink-600 mb-2">{offer.price} € / mois</p>
                                <p className="text-sm text-gray-700 mb-4">{offer.description}</p>

                                {offer.availableAmenities && offer.availableAmenities.length > 0 && (
                                  <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-2">Prestations disponibles</p>
                                    <div className="flex flex-wrap gap-1">
                                      {offer.availableAmenities.map((amenity: string) => (
                                        <Badge 
                                          key={amenity} 
                                          variant="outline"
                                          className={`text-xs capitalize ${
                                            listing.amenities?.includes(amenity) 
                                              ? 'bg-green-50 text-green-700 border-green-200' 
                                              : 'bg-gray-50 text-gray-600'
                                          }`}
                                        >
                                          {amenity.replace(/_/g, " ")}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Contacter
                                  </Button>
                                  {offer.status === "pending" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => updateOfferStatusMutation.mutate({ 
                                          offerId: offer.id, 
                                          status: "accepted" 
                                        })}
                                      >
                                        Accepter
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => updateOfferStatusMutation.mutate({ 
                                          offerId: offer.id, 
                                          status: "rejected" 
                                        })}
                                      >
                                        Refuser
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        {allPropertyOffers.filter((offer: Offer) => offer.requestId === listing.id).length === 0 && (
                          <div className="col-span-2 text-center py-8 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">Aucune offre reçue pour cette demande</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
