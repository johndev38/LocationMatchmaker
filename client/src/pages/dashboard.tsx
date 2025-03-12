import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [targetRequestId, setTargetRequestId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rentalRequests = [], isLoading: loadingRequests } = useQuery<any[]>({
    queryKey: ["rentalRequests"],
    queryFn: async () => {
      const response = await fetch("/api/rental-requests");
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des demandes de location");
      return response.json();
    },
  });

  const { data: propertyOffers = [], isLoading: loadingOffers } = useQuery<any[]>({
    queryKey: ["propertyOffers", selectedRequest],
    enabled: selectedRequest !== null,
    queryFn: async () => {
      if (selectedRequest === null) return [];
      const response = await fetch(`/api/property-offers/${selectedRequest}`);
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

  if (loadingRequests)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 pt-20 pb-8 grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Demandes de location</h2>
          {rentalRequests.length > 0 ? (
            rentalRequests.map((request: any) => (
              <Card
                key={request.id}
                className={`mb-4 cursor-pointer transition-transform transform hover:scale-105 ${
                  selectedRequest === request.id ? "border-2 border-pink-500" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Demande #{request.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div onClick={() => setSelectedRequest(request.id)}>
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
      </main>

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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="offer-price" className="text-right">
                Prix (€)
              </Label>
              <Input
                id="offer-price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                className="col-span-3"
                placeholder="Entrez votre prix"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="offer-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="offer-description"
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                className="col-span-3"
                placeholder="Décrivez votre offre"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleCreateOffer}
              disabled={createOfferMutation.isPending}
            >
              {createOfferMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Envoyer l'offre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
