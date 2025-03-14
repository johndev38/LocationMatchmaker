import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Header from "./header";

type PropertyOffer = {
  id: number;
  requestId: number;
  landlordId: number;
  price: number;
  description: string;
  status: string;
  availableAmenities?: string[];
};

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

export default function SearchLocations() {
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<RentalRequest | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [targetRequestId, setTargetRequestId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);

  const { data: rentalRequests = [], isLoading: loadingRequests } = useQuery<RentalRequest[]>({
    queryKey: ["/api/rental-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rental-requests");
      return await res.json();
    },
  });

  const { data: landlordOffers = [], isLoading: loadingLandlordOffers } = useQuery({
    queryKey: ["landlordOffers"],
    queryFn: async () => {
      const response = await fetch("/api/landlord/property-offers");
      if (!response.ok) throw new Error("Erreur lors de la récupération des offres");
      return response.json();
    },
    enabled: user?.isLandlord,
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
          availableAmenities,
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
      
      queryClient.invalidateQueries({ queryKey: ["propertyOffers", targetRequestId] });
      
      setOfferPrice("");
      setOfferDescription("");
      setAvailableAmenities([]);
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

  const hasExistingOffer = (requestId: number) => {
    return landlordOffers.some((offer: PropertyOffer) => offer.requestId === requestId);
  };

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
          <div className="text-center">Connectez-vous pour accéder à la recherche de locations</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">Recherche de locations</h1>

        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Demandes disponibles</h2>
          {rentalRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rentalRequests.map((request: RentalRequest) => {
                const existingOffer = hasExistingOffer(request.id);
                return (
                  <Card
                    key={request.id}
                    className={cn(
                      "cursor-pointer transition-transform h-[280px] flex flex-col",
                      existingOffer ? "opacity-50 pointer-events-none" : "hover:scale-105",
                      selectedRequest === request ? "border-2 border-pink-500" : ""
                    )}
                  >
                    <CardHeader className="p-3 flex-none">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-semibold">
                          {request.departureCity}
                          {existingOffer && (
                            <span className="ml-2 text-xs text-gray-500">(Offre envoyée)</span>
                          )}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {new Date(request.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(request.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 flex-grow">
                      <div onClick={() => !existingOffer && setSelectedRequest(request)} className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Type :</span>
                          <span className="font-medium">{Array.isArray(request.locationType) ? request.locationType.join(", ") : request.locationType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Distance :</span>
                          <span className="font-medium">{request.maxDistance} km</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Budget :</span>
                          <span className="font-medium">{request.maxBudget}€</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Voyageurs :</span>
                          <span className="font-medium">
                            {request.adults + request.children + request.babies} pers.
                            {request.pets > 0 && `, ${request.pets} animaux`}
                          </span>
                        </div>
                        {request.amenities && request.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {request.amenities.map((amenity) => (
                              <span key={amenity} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                {amenity.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {!existingOffer && user?.isLandlord && (
                      <CardFooter className="p-3 flex-none">
                        <Button
                          onClick={() => openOfferDialog(request.id)}
                          className="w-full h-8 text-sm"
                          size="sm"
                        >
                          Faire une offre
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">Aucune demande de location disponible.</p>
          )}
        </section>
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
                onClick={handleCreateOffer}
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
