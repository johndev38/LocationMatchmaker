import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Header from "./header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { amenities } from "@shared/schema";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PropertyOffer = {
  id: number;
  requestId: number;
  price: number;
  description: string;
  status: string;
  availableAmenities: string[];
  rentalRequest: {
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
    amenities: string[];
  };
};

export default function LandlordOffers() {
  const { data: offers, isLoading, error } = useQuery<PropertyOffer[]>({
    queryKey: ["/api/landlord/property-offers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/landlord/property-offers");
      const data = await res.json();
      console.log("Données reçues:", data); // Pour déboguer
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Une erreur est survenue lors du chargement des offres.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-8">Toutes les offres en cours</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers?.map((offer) => (
            <Card key={offer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">
                    {offer.rentalRequest?.departureCity || "Ville non spécifiée"}
                  </CardTitle>
                  <Badge variant={offer.status === "pending" ? "default" : "secondary"}>
                    {offer.status === "pending" ? "En attente" : "Traité"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Détails de la demande</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Type de logement : {offer.rentalRequest?.locationType?.join(", ") || "Non spécifié"}</li>
                      <li>• Distance max : {offer.rentalRequest?.maxDistance || 0}km</li>
                      <li>• Budget max : {offer.rentalRequest?.maxBudget || 0}€</li>
                      <li>• Période : {offer.rentalRequest?.startDate ? new Date(offer.rentalRequest.startDate).toLocaleDateString() : "Non spécifiée"} - {offer.rentalRequest?.endDate ? new Date(offer.rentalRequest.endDate).toLocaleDateString() : "Non spécifiée"}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Composition du groupe</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Adultes : {offer.rentalRequest?.adults || 0}</li>
                      <li>• Enfants : {offer.rentalRequest?.children || 0}</li>
                      <li>• Bébés : {offer.rentalRequest?.babies || 0}</li>
                      <li>• Animaux : {offer.rentalRequest?.pets || 0}</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Prestations demandées</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {amenities.map((amenity) => {
                        const isRequested = offer.rentalRequest?.amenities?.includes(amenity);
                        const isAvailable = offer.availableAmenities?.includes(amenity);
                        
                        if (!isRequested) return null;
                        
                        return (
                          <div 
                            key={amenity} 
                            className={cn(
                              "flex items-center gap-2 p-2 rounded",
                              isAvailable ? "bg-green-50" : "bg-red-50"
                            )}
                          >
                            {isAvailable ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="capitalize">
                              {amenity.replace(/_/g, " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Votre offre</h3>
                    <p className="text-lg font-bold text-primary">{offer.price}€</p>
                    <p className="text-sm text-gray-600 mt-1">{offer.description}</p>
                  </div>

                  {offer.status === "pending" && (
                    <div className="flex gap-2 mt-4">
                      <Button className="w-full" variant="outline">
                        Modifier l'offre
                      </Button>
                      <Button className="w-full" variant="destructive">
                        Annuler
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {offers?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune offre en cours pour le moment.</p>
          </div>
        )}
      </main>
    </div>
  );
} 