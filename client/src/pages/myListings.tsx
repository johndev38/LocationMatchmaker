import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  MapPin, 
  Calendar, 
  Users, 
  Ruler, 
  Euro, 
  Trash2, 
  MessageSquare,
  CheckCircle2,
  XCircle, 
  Filter,
  Home
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  owner?: {
    name: string;
    avatar?: string;
  };
}

export default function MyListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

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

  // Filtrer les annonces selon l'onglet actif
  const filteredListings = userListings.filter((listing: any) => {
    if (activeTab === "active") return listing.status === "active";
    if (activeTab === "inactive") return listing.status === "inactive" || listing.status === "expired";
    return true; // 'all' tab
  });

  // Si une demande est sélectionnée, filtrer pour n'afficher que ses offres
  const displayedOffers = selectedRequestId 
    ? allPropertyOffers.filter((offer: Offer) => offer.requestId === selectedRequestId)
    : allPropertyOffers;

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

        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Actives</span>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span>Terminées</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Toutes</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {userListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Home className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Vous n'avez pas encore de demande de location</p>
            <p className="text-gray-400 mb-6">Créez votre première demande pour recevoir des offres de propriétaires</p>
            <Button asChild>
              <a href="/create-request">Créer une demande</a>
            </Button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">Aucune demande {activeTab === "active" ? "active" : activeTab === "inactive" ? "terminée" : ""}</p>
            {activeTab !== "active" && (
              <Button asChild>
                <a href="/create-request">Créer une nouvelle demande</a>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredListings.map((listing: any) => (
              <Card 
                key={listing.id} 
                className={`overflow-hidden transition-all ${selectedRequestId === listing.id ? 'ring-2 ring-pink-500' : ''}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-pink-500" />
                        {listing.departureCity}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(listing.startDate).toLocaleDateString('fr-FR')} - {new Date(listing.endDate).toLocaleDateString('fr-FR')}
                        </span>
                        <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                          {listing.status === 'active' ? 'Active' : 'Terminée'}
                        </Badge>
                      </CardDescription>
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
                </CardHeader>

                <CardContent>
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
                </CardContent>

                <CardFooter className="flex justify-between items-center px-6 py-4 bg-gray-50">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      {allPropertyOffers.filter((o: Offer) => o.requestId === listing.id).length} 
                    </span> offres reçues
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedRequestId(selectedRequestId === listing.id ? null : listing.id)}
                  >
                    {selectedRequestId === listing.id ? "Masquer les offres" : "Voir les offres"}
                  </Button>
                </CardFooter>

                {/* Section des offres reçues (visible seulement si cette demande est sélectionnée) */}
                {selectedRequestId === listing.id && (
                  <div className="border-t border-gray-100 px-6 py-5">
                    <h3 className="text-xl font-semibold mb-4">Offres reçues</h3>
                    {loadingOffers ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                      </div>
                    ) : allPropertyOffers.filter((offer: Offer) => offer.requestId === listing.id).length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">Aucune offre reçue pour cette demande</p>
                        <p className="text-gray-400 text-sm mt-2">Les propriétaires vous contacteront dès qu'ils auront des logements qui correspondent à vos critères</p>
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
                                              className="absolute inset-0 w-full h-full object-cover"
                                            />
                                          </div>
                                        </CarouselItem>
                                      ))}
                                    </CarouselContent>
                                    <CarouselPrevious className="left-2" />
                                    <CarouselNext className="right-2" />
                                  </Carousel>
                                </div>
                              ) : (
                                <div className="h-64 bg-gray-100 flex items-center justify-center">
                                  <p className="text-gray-400">Aucune photo disponible</p>
                                </div>
                              )}

                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <CardTitle>
                                      {offer.property?.title || "Propriété sans titre"}
                                    </CardTitle>
                                    <CardDescription>
                                      {offer.property?.address}
                                    </CardDescription>
                                  </div>
                                  <Badge
                                    variant={
                                      offer.status === "accepted"
                                        ? "default"
                                        : offer.status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {offer.status === "pending"
                                      ? "En attente"
                                      : offer.status === "accepted"
                                      ? "Acceptée"
                                      : "Refusée"}
                                  </Badge>
                                </div>
                              </CardHeader>

                              <CardContent>
                                <p className="text-2xl font-bold text-pink-600 mb-3">{offer.price} € <span className="text-sm font-normal text-gray-500">/ mois</span></p>
                                <p className="text-gray-700 mb-4">{offer.description}</p>
                                
                                {offer.availableAmenities && offer.availableAmenities.length > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-2">Prestations incluses</p>
                                    <div className="flex flex-wrap gap-2">
                                      {offer.availableAmenities.map((amenity: string) => (
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
                              </CardContent>

                              <CardFooter className="flex justify-between bg-gray-50 pt-3">
                                <div className="flex items-center gap-2">
                                  <Avatar>
                                    <AvatarImage src={offer.owner?.avatar} />
                                    <AvatarFallback>{offer.owner?.name?.charAt(0) || "U"}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{offer.owner?.name || "Propriétaire"}</span>
                                </div>
                                
                                <div className="flex gap-2">
                                  {offer.status === "pending" && (
                                    <>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => updateOfferStatusMutation.mutate({ offerId: offer.id, status: "rejected" })}
                                      >
                                        Refuser
                                      </Button>
                                      <Button 
                                        size="sm"
                                        onClick={() => updateOfferStatusMutation.mutate({ offerId: offer.id, status: "accepted" })}
                                      >
                                        Accepter
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" /> 
                                    Contacter
                                  </Button>
                                </div>
                              </CardFooter>
                            </Card>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
