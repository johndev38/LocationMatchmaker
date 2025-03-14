import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MyListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

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

  // Récupérer les offres pour une demande spécifique
  const { data: propertyOffers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ["propertyOffers", selectedRequest],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/property-offers/${selectedRequest}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des offres");
      return response.json();
    },
    enabled: selectedRequest !== null,
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
      queryClient.invalidateQueries({ queryKey: ["propertyOffers", selectedRequest] });
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
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Réponse du serveur:", errorText);
        throw new Error("Erreur lors de la suppression de la demande");
      }
      // Pour une suppression, on ne s'attend pas forcément à recevoir du JSON
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userListings"] });
      setSelectedRequest(null);
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
        <h1 className="text-3xl font-bold mb-6">Mes annonces</h1>

        {userListings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Vous n'avez pas encore d'annonces</p>
            <Button asChild>
              <a href="/create-request">Créer une annonce</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Mes demandes de location</h2>
              {userListings.map((listing: any) => (
                <Card key={listing.id} className={selectedRequest === listing.id ? "border-pink-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{listing.departureCity}</CardTitle>
                        <CardDescription>
                          Du {new Date(listing.startDate).toLocaleDateString('fr-FR')} au{" "}
                          {new Date(listing.endDate).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <Badge>{listing.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Type de location</p>
                        <p>{listing.locationType.join(", ")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Budget max</p>
                        <p>{listing.maxBudget} €</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Voyageurs</p>
                        <p>
                          {listing.adults} adultes
                          {listing.children > 0 && `, ${listing.children} enfants`}
                          {listing.babies > 0 && `, ${listing.babies} bébés`}
                          {listing.pets > 0 && `, ${listing.pets} animaux`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Distance max</p>
                        <p>{listing.maxDistance} km</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRequest(listing.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" /> Voir les offres
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
                          console.log("Suppression de la demande", listing.id);
                          deleteRequestMutation.mutate(listing.id);
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {selectedRequest && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Offres reçues</h2>
                {loadingOffers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                  </div>
                ) : propertyOffers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-gray-500">Aucune offre reçue pour cette demande</p>
                    </CardContent>
                  </Card>
                ) : (
                  propertyOffers.map((offer: any) => (
                    <Card key={offer.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">Offre #{offer.id}</CardTitle>
                          <Badge
                            className={
                              offer.status === "pending" ? "bg-yellow-500" :
                              offer.status === "accepted" ? "bg-green-500" :
                              "bg-red-500"
                            }
                          >
                            {offer.status === "pending" ? "En attente" :
                             offer.status === "accepted" ? "Acceptée" :
                             "Refusée"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-500">Prix proposé</p>
                            <p className="font-semibold text-xl">{offer.price} €</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Description</p>
                            <p className="text-gray-700">{offer.description}</p>
                          </div>
                          {offer.availableAmenities && offer.availableAmenities.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2">Prestations disponibles</p>
                              <div className="flex flex-wrap gap-2">
                                {offer.availableAmenities.map((amenity: string) => (
                                  <Badge 
                                    key={amenity} 
                                    variant="secondary"
                                    className={`capitalize ${
                                      offer.request?.amenities?.includes(amenity) 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {amenity.replace(/_/g, " ")}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      {offer.status === "pending" && (
                        <CardFooter className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-50"
                            size="sm"
                            onClick={() => updateOfferStatusMutation.mutate({ offerId: offer.id, status: "accepted" })}
                            disabled={updateOfferStatusMutation.isPending}
                          >
                            <Check className="mr-1 h-4 w-4" /> Accepter
                          </Button>
                          <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            size="sm"
                            onClick={() => updateOfferStatusMutation.mutate({ offerId: offer.id, status: "rejected" })}
                            disabled={updateOfferStatusMutation.isPending}
                          >
                            <X className="mr-1 h-4 w-4" /> Refuser
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
