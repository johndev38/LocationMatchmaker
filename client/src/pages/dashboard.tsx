import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "./header";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { amenities } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

type RentalRequest = {
  id: number;
  userId: number;
  departureCity: string;
  locationType: string[];
  maxDistance: number;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  maxBudget: number;
  startDate: string;
  endDate: string;
  status: string;
  amenities: string[];
};

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [targetRequestId, setTargetRequestId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("requests");
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);

  const { data: rentalRequests = [], isLoading: loadingRequests } = useQuery<RentalRequest[]>({
    queryKey: ["/api/rental-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rental-requests");
      return await res.json();
    },
  });

  const { data: propertyOffers = [], isLoading: loadingOffers } = useQuery<any[]>({
    queryKey: ["propertyOffers", selectedRequest],
    enabled: selectedRequest !== null,
    queryFn: async () => {
      if (selectedRequest === null) return [];
      const response = await fetch(`/api/property-offers/${selectedRequest.id}`);
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des offres");
      return response.json();
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: async ({ requestId, price, description }: { requestId: number, price: string, description: string }) => {
      const response = await fetch("/api/property-offers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          price: parseInt(price),
          description,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'offre");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Votre offre a été envoyée avec succès",
      });
      
      // Invalidate related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["propertyOffers", targetRequestId] });
      
      // Reset form and close dialog
      setOfferPrice("");
      setOfferDescription("");
      setOfferDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateOffer = () => {
    if (!offerPrice || !offerDescription || !targetRequestId) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    createOfferMutation.mutate({
      requestId: targetRequestId,
      price: offerPrice,
      description: offerDescription,
    });
  };

  const openOfferDialog = (requestId: number) => {
    setTargetRequestId(requestId);
    setOfferDialogOpen(true);
  };

  // Récupérer les offres du propriétaire
  const { data: landlordOffers = [], isLoading: loadingLandlordOffers } = useQuery({
    queryKey: ["landlordOffers"],
    queryFn: async () => {
      const response = await fetch("/api/landlord/property-offers");
      if (!response.ok) throw new Error("Erreur lors de la récupération des offres");
      return response.json();
    },
    enabled: user?.isLandlord,
  });

  // Mutation pour mettre à jour le statut d'une offre
  const updateOfferStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: string }) => {
      const response = await fetch(`/api/property-offers/${offerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut de l'offre");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landlordOffers"] });
    },
  });

  if (loadingRequests)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center">Connectez-vous pour accéder à votre tableau de bord</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="requests">Demandes</TabsTrigger>
            {user.isLandlord && <TabsTrigger value="offers">Mes Offres</TabsTrigger>}
          </TabsList>

          <TabsContent value="requests">
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Demandes de location</h2>
              {rentalRequests.length > 0 ? (
                rentalRequests.map((request: RentalRequest) => (
                  <Card
                    key={request.id}
                    className={`mb-4 cursor-pointer transition-transform transform hover:scale-105 ${
                      selectedRequest === request ? "border-2 border-pink-500" : ""
                    }`}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Demande #{request.id}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div onClick={() => setSelectedRequest(request)}>
                        <p className="text-gray-600">
                          Ville de départ :{" "}
                          <span className="font-semibold">{request.departureCity}</span>
                        </p>
                        <p className="text-gray-600">
                          Période :{" "}
                          <span className="font-semibold">
                            {new Date(request.startDate).toLocaleDateString()} -{" "}
                            {new Date(request.endDate).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Types de destination :{" "}
                          <span className="font-semibold">
                            {Array.isArray(request.locationType)
                              ? request.locationType.join(", ")
                              : request.locationType}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          Distance maximale :{" "}
                          <span className="font-semibold">{request.maxDistance} km</span>
                        </p>
                        <p className="text-gray-600">
                          Budget :{" "}
                          <span className="font-semibold">{request.maxBudget}€</span>
                        </p>
                        <p className="text-gray-600">
                          Voyageurs :{" "}
                          <span className="font-semibold">
                            {request.adults} Adultes, {request.children} Enfants,{" "}
                            {request.babies} Bébés, {request.pets} Animaux
                          </span>
                        </p>
                      </div>
                      
                      {/* Bouton pour faire une offre (visible uniquement pour les propriétaires) */}
                      {user?.isLandlord && (
                        <div className="mt-4">
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              openOfferDialog(request.id);
                            }}
                            className="w-full"
                          >
                            Faire une offre
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">Aucune demande pour le moment.</p>
              )}
            </section>

            {/* Section des Offres reçues */}
            {selectedRequest && (
              <section>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Offres reçues</h2>
                {loadingOffers ? (
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                  </div>
                ) : propertyOffers.length > 0 ? (
                  propertyOffers.map((offer: any) => (
                    <Card key={offer.id} className="mb-4 transition-transform transform hover:scale-105">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-800">{offer.price} €</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600">{offer.description}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500">Aucune offre reçue pour cette demande.</p>
                )}
              </section>
            )}
          </TabsContent>
          
          {user.isLandlord && (
            <TabsContent value="offers">
              <Card>
                <CardHeader>
                  <CardTitle>Mes offres de propriété</CardTitle>
                  <CardDescription>Gérez les offres que vous avez faites aux demandes des utilisateurs</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingLandlordOffers ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                    </div>
                  ) : landlordOffers.length === 0 ? (
                    <div className="text-center py-4">
                      Vous n'avez pas encore fait d'offres
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {landlordOffers.map((offer: any) => (
                        <Card key={offer.id} className="overflow-hidden">
                          <CardHeader className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">Offre #{offer.id}</CardTitle>
                                <CardDescription>Pour la demande #{offer.requestId}</CardDescription>
                              </div>
                              <div className="text-sm font-semibold">
                                <span className={`px-2 py-1 rounded-full ${
                                  offer.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                  offer.status === "accepted" ? "bg-green-100 text-green-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {offer.status === "pending" ? "En attente" :
                                   offer.status === "accepted" ? "Acceptée" : "Refusée"}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-gray-500">Prix</div>
                                <div className="font-semibold">{offer.price} €</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Description</div>
                                <div className="font-semibold">{offer.description}</div>
                              </div>
                            </div>
                          </CardContent>
                          {offer.status === "pending" && (
                            <CardFooter className="flex justify-end gap-2 p-4 bg-gray-50">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500 text-red-500 hover:bg-red-50"
                                onClick={() => updateOfferStatusMutation.mutate({ offerId: offer.id, status: "rejected" })}
                                disabled={updateOfferStatusMutation.isPending}
                              >
                                <X className="mr-1 h-4 w-4" /> Annuler
                              </Button>
                            </CardFooter>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialog pour créer une offre */}
      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Faire une offre</DialogTitle>
            <DialogDescription>
              Proposez votre prix et décrivez votre offre pour cette demande de location.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="price">Prix proposé (€)</Label>
                <Input
                  id="price"
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">Description de votre offre</Label>
                <Textarea
                  id="description"
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Prestations disponibles</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedRequest?.amenities?.map((amenity: string) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={availableAmenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAvailableAmenities([...availableAmenities, amenity]);
                          } else {
                            setAvailableAmenities(
                              availableAmenities.filter((a) => a !== amenity)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`amenity-${amenity}`}
                        className="capitalize cursor-pointer"
                      >
                        {amenity.replace(/_/g, " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createOfferMutation.isPending}
              >
                {createOfferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer l'offre"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
