import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Home, Mountain, Waves, Building2, Trees, Warehouse, Leaf, Droplets } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';

const locationTypeIcons = {
  ville: <Building2 className="h-4 w-4" />,
  montagne: <Mountain className="h-4 w-4" />,
  mer: <Waves className="h-4 w-4" />,
  campagne: <Trees className="h-4 w-4" />,
  ferme: <Warehouse className="h-4 w-4" />,
  forêt: <Leaf className="h-4 w-4" />,
  lac: <Droplets className="h-4 w-4" />,
};

const mapContainerStyle = {
  height: '500px',
  width: '100%',
};

const MapWithCircle: React.FC<{ coordinates: { lat: number; lng: number }; maxDistance: number; departureCity: string }> = ({ coordinates, maxDistance, departureCity }) => (
  <LoadScript googleMapsApiKey="AIzaSyB7ozOJkSl78CMvhM47gs4ASaUsaFG3hB8">
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={coordinates}
      zoom={7}
    >
      <Marker position={coordinates} label={departureCity} />
      <Circle
        center={coordinates}
        radius={maxDistance * 1000} // Convertir la distance en mètres
        options={{
          strokeColor: '#0080ff',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#0080ff',
          fillOpacity: 0.35,
        }}
      />
    </GoogleMap>
  </LoadScript>
);

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  const { data: rentalRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/rental-requests"],
  });

  const { data: propertyOffers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ["/api/property-offers", selectedRequest],
    enabled: selectedRequest !== null,
  });

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/property-offers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/property-offers", selectedRequest],
      });
      toast({
        title: "Succès",
        description: "Votre offre a été soumise.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitOffer = (requestId: number, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    createOfferMutation.mutate({
      requestId,
      price: parseInt(formData.get("price") as string),
      description: formData.get("description"),
    });
    event.currentTarget.reset();
  };

  if (isLoadingRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const coordinates = { lat: 48.8566, lng: 2.3522 }; // Exemple pour Paris
  const maxDistance = 100; // Exemple de distance maximale

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2">
                <Home className="h-6 w-6" />
                <span className="font-bold">RentalMatch</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Déconnexion"
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          {user?.isLandlord ? "Demandes disponibles" : "Vos demandes"}
        </h1>

        <MapWithCircle coordinates={coordinates} maxDistance={maxDistance} departureCity="Paris" />

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            {rentalRequests?.map((request: any) => (
              <Card
                key={request.id}
                className={`mb-4 ${
                  selectedRequest === request.id ? "border-primary" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle>Demande #{request.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p>Départ de : {request.departureCity}</p>
                    <p>Destination : {request.location}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span>Types : </span>
                      {request.locationType.map((type: string) => (
                        <div
                          key={type}
                          className="flex items-center gap-1 bg-muted rounded-full px-3 py-1 text-sm"
                        >
                          {locationTypeIcons[type as keyof typeof locationTypeIcons]}
                          <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                        </div>
                      ))}
                    </div>
                    <p>Distance max : {request.maxDistance}km</p>
                    <p>Personnes : {request.peopleCount}</p>
                    <p>Budget : {request.maxBudget}€</p>
                    {user?.isLandlord && (
                      <form
                        onSubmit={(e) => handleSubmitOffer(request.id, e)}
                        className="mt-4 space-y-4"
                      >
                        <div>
                          <Input
                            name="price"
                            type="number"
                            placeholder="Votre prix"
                            required
                          />
                        </div>
                        <div>
                          <Textarea
                            name="description"
                            placeholder="Décrivez votre propriété"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={createOfferMutation.isPending}
                        >
                          {createOfferMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Soumettre l'offre
                        </Button>
                      </form>
                    )}
                    {!user?.isLandlord && (
                      <Button
                        onClick={() => setSelectedRequest(request.id)}
                        variant="secondary"
                      >
                        Voir les offres
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedRequest && !user?.isLandlord && (
            <div>
              <h2 className="text-xl font-bold mb-4">Offres</h2>
              {isLoadingOffers ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                propertyOffers?.map((offer: any) => (
                  <Card key={offer.id} className="mb-4">
                    <CardHeader>
                      <CardTitle>{offer.price}€</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{offer.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}