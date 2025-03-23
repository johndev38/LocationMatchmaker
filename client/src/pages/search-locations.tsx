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
import { Loader2, MapPin, MoveHorizontal, Search, Filter, X, Home, Ruler } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import Header from "./header";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useJsApiLoader } from "@react-google-maps/api";

// Fonction utilitaire pour calculer la distance entre deux points géographiques (en km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance en km
  return distance;
}

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

type UserInfo = {
  username: string;
  email: string;
  address: string;
  phone: string;
  isLandlord: boolean;
};

type PropertyInfo = {
  id?: number;
  landlordId?: number;
  title: string;
  description: string;
  address: string;
  photos?: string[];
  amenities: string[];
  createdAt?: string;
  updatedAt?: string;
};

type GeocodingResult = {
  lat: number;
  lng: number;
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
  
  // Filtres
  const [filterDistance, setFilterDistance] = useState<number>(2000);
  const [filterCity, setFilterCity] = useState<string>("");
  const [filterLocationType, setFilterLocationType] = useState<string[]>([]);
  const [filterBudgetMin, setFilterBudgetMin] = useState<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<number>(0);
  
  // Nouveaux filtres pour professionnels
  const [filterByProximity, setFilterByProximity] = useState<boolean>(false);
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [propertyCoords, setPropertyCoords] = useState<GeocodingResult | null>(null);
  const [requestCoords, setRequestCoords] = useState<Map<number, GeocodingResult>>(new Map());
  const [loadingGeocode, setLoadingGeocode] = useState<boolean>(false);
  
  // Configuration de l'API Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    libraries: ["places"],
  });

  // Geocoder une adresse et obtenir ses coordonnées
  const geocodeAddress = useCallback(async (address: string, isProperty = false, requestId?: number) => {
    if (!address || !isLoaded) return;
    
    try {
      setLoadingGeocode(true);
      const geocoder = new google.maps.Geocoder();
      
      const result = await new Promise<GeocodingResult>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            reject(new Error(`Erreur de géocodage: ${status}`));
          }
        });
      });
      
      if (isProperty) {
        setPropertyCoords(result);
      } else if (requestId) {
        setRequestCoords(prev => new Map(prev).set(requestId, result));
      }
      
      return result;
    } catch (error) {
      console.error("Erreur lors du géocodage:", error);
      return null;
    } finally {
      setLoadingGeocode(false);
    }
  }, [isLoaded]);
  
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
  
  // Récupérer les informations du bien si l'utilisateur est un professionnel
  const { data: propertyData } = useQuery<PropertyInfo>({
    queryKey: ["property"],
    queryFn: async () => {
      const response = await fetch("/api/property");
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Erreur lors de la récupération du bien");
      }
      return response.json();
    },
    enabled: user?.isLandlord
  });
  
  // Effet pour traiter les données de propriété quand elles sont chargées
  useEffect(() => {
    if (propertyData) {
      setPropertyInfo(propertyData);
      geocodeAddress(propertyData.address, true);
    }
  }, [propertyData, geocodeAddress]);
  
  // Geocoder les adresses des demandes lorsque filterByProximity est activé
  useEffect(() => {
    if (filterByProximity && propertyCoords && rentalRequests.length > 0) {
      // Geocode des adresses des demandes qui n'ont pas encore été geocodées
      rentalRequests.forEach(request => {
        if (!requestCoords.has(request.id)) {
          geocodeAddress(request.departureCity, false, request.id);
        }
      });
    }
  }, [filterByProximity, propertyCoords, rentalRequests, requestCoords, geocodeAddress]);

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
  
  // Fonction pour vérifier si un bien est à la distance souhaitée du locataire
  const isWithinUserDistance = (request: RentalRequest): boolean => {
    if (!filterByProximity || !propertyCoords) return true;
    
    const requestCoord = requestCoords.get(request.id);
    if (!requestCoord) return true; // Si pas encore géocodé, on l'inclut par défaut
    
    const distance = calculateDistance(
      propertyCoords.lat, 
      propertyCoords.lng, 
      requestCoord.lat, 
      requestCoord.lng
    );
    
    // La modification est ici: on inverse la comparaison
    // Pour que la distance entre propriété et locataire soit < à la distance définie par le locataire
    return distance <= request.maxDistance;
  };
  
  // Fonction pour filtrer les demandes
  const getFilteredRequests = () => {
    return rentalRequests.filter((request) => {
      // Filtrer par distance maximale (montrer uniquement les demandes dont la distance est <= à celle du filtre)
      if (filterDistance < request.maxDistance) {
        return false;
      }
      
      // Filtrer par ville
      if (filterCity && !request.departureCity.toLowerCase().includes(filterCity.toLowerCase())) {
        return false;
      }
      
      // Filtrer par type de location
      if (filterLocationType.length > 0 && !filterLocationType.some(type => request.locationType.includes(type))) {
        return false;
      }
      
      // Filtrer par budget minimum (propriétaire veut offrir un logement d'un certain prix minimum)
      if (filterBudgetMin > 0 && request.maxBudget < filterBudgetMin) {
        return false;
      }
      
      // Nouveau filtre: Si le mode proximité est activé, vérifier si le bien est à la distance souhaitée du locataire
      if (filterByProximity && !isWithinUserDistance(request)) {
        return false;
      }
      
      return true;
    });
  };
  
  // Appliquer les filtres
  const applyFilters = () => {
    let count = 0;
    if (filterDistance < 2000) count++;
    if (filterCity) count++;
    if (filterLocationType.length > 0) count++;
    if (filterBudgetMin > 0) count++;
    if (filterByProximity) count++;
    setAppliedFilters(count);
    setIsFilterOpen(false);
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterDistance(2000);
    setFilterCity("");
    setFilterLocationType([]);
    setFilterBudgetMin(0);
    setFilterByProximity(false);
    setAppliedFilters(0);
  };

  // Obtenir la liste filtrée des demandes
  const filteredRequests = getFilteredRequests();

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Recherche de locations</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Input
                placeholder="Rechercher par ville..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-60 pr-10"
              />
              <Search className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrer
                  {appliedFilters > 0 && (
                    <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      {appliedFilters}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtres de recherche</SheetTitle>
                  <SheetDescription>
                    Affinez les résultats selon vos critères
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Distance maximale</Label>
                      <span className="text-sm font-medium">{filterDistance} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MoveHorizontal className="h-4 w-4 text-gray-500" />
                      <Slider
                        defaultValue={[filterDistance]}
                        max={2000}
                        step={50}
                        value={[filterDistance]}
                        onValueChange={(values) => setFilterDistance(values[0])}
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Ne montrer que les demandes dont la distance max. est de {filterDistance}km ou moins
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Budget minimum</Label>
                    <div className="flex">
                      <Input
                        type="number"
                        placeholder="0"
                        value={filterBudgetMin === 0 ? "" : filterBudgetMin}
                        onChange={(e) => setFilterBudgetMin(Number(e.target.value))}
                        className="w-full"
                      />
                      <span className="flex items-center bg-gray-100 px-3 rounded-r-md border border-l-0 border-input">€</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ne montrer que les demandes avec un budget minimum de {filterBudgetMin}€
                    </p>
                  </div>
                  
                  {user?.isLandlord && propertyInfo?.address && (
                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="filter-by-proximity" className="font-medium text-pink-700 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Filtrer les demandes par proximité
                        </Label>
                        <Switch
                          id="filter-by-proximity"
                          checked={filterByProximity}
                          onCheckedChange={setFilterByProximity}
                          className="data-[state=checked]:bg-pink-600"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Home className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 truncate" title={propertyInfo.address}>
                          {propertyInfo.address}
                        </span>
                      </div>
                      
                      <div className="bg-pink-50 p-3 rounded-md border border-pink-100 mt-2">
                        <p className="text-sm text-pink-800">
                          <strong>Ce filtre affiche uniquement</strong> les demandes pour lesquelles votre propriété se trouve dans le rayon maximum défini par les locataires.
                        </p>
                        <p className="text-xs text-pink-700 mt-1">
                          L'activation de ce filtre masque les demandes incompatibles avec les contraintes de distance des locataires.
                        </p>
                      </div>
                      
                      {loadingGeocode && (
                        <div className="flex items-center justify-center mt-2 p-2 bg-gray-50 rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin text-pink-500 mr-2" />
                          <span className="text-sm text-gray-700">Calcul des distances en cours...</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Type de location</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["ville", "montagne", "mer", "campagne", "ferme", "forêt", "lac"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filterLocationType.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFilterLocationType([...filterLocationType, type]);
                              } else {
                                setFilterLocationType(filterLocationType.filter(t => t !== type));
                              }
                            }}
                          />
                          <Label htmlFor={`type-${type}`} className="capitalize">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <SheetFooter className="flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline" 
                    onClick={resetFilters}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={applyFilters}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Appliquer les filtres
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Demandes disponibles</h2>
            <div className="text-sm text-gray-500">{filteredRequests.length} résultat(s)</div>
          </div>
          
          {filteredRequests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRequests.map((request: RentalRequest) => {
                const existingOffer = hasExistingOffer(request.id);
                const requestCoord = requestCoords.get(request.id);
                const distance = propertyCoords && requestCoord
                  ? Math.round(calculateDistance(
                      propertyCoords.lat,
                      propertyCoords.lng,
                      requestCoord.lat,
                      requestCoord.lng
                    ))
                  : null;
                  
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
                      <div className="flex flex-col space-y-1">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-semibold">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-pink-500" />
                              {request.departureCity}
                              {existingOffer && (
                                <span className="ml-2 text-xs text-gray-500">(Offre envoyée)</span>
                              )}
                            </div>
                          </CardTitle>
                          {distance !== null && propertyCoords && (
                            <Badge className={distance <= request.maxDistance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {distance <= request.maxDistance ? 'Dans le rayon' : 'Hors rayon'}
                            </Badge>
                          )}
                        </div>
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
                        {distance !== null && user?.isLandlord && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">Votre bien :</span>
                            <span className={`font-medium ${distance <= request.maxDistance ? 'text-green-600' : 'text-red-600'}`}>
                              {distance} km {distance <= request.maxDistance ? '✓' : '✗'}
                            </span>
                          </div>
                        )}
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
                            {request.amenities.slice(0, 3).map((amenity) => (
                              <span key={amenity} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                {amenity.replace(/_/g, " ")}
                              </span>
                            ))}
                            {request.amenities.length > 3 && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                                +{request.amenities.length - 3}
                              </span>
                            )}
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
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">Aucune demande de location ne correspond à vos critères.</p>
              {appliedFilters > 0 && (
                <Button variant="outline" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </section>
      </div>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faire une offre</DialogTitle>
            <DialogDescription>
              Proposez un logement au locataire potentiel
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix proposé (€)</Label>
              <Input
                id="price"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="Ex: 750"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description de votre bien</Label>
              <Textarea
                id="description"
                value={offerDescription}
                onChange={(e) => setOfferDescription(e.target.value)}
                placeholder="Décrivez les caractéristiques principales de votre bien..."
                rows={4}
              />
            </div>
            
            <div className="space-y-3">
              <Label>Équipements disponibles</Label>
              {selectedRequest && selectedRequest.amenities && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {selectedRequest.amenities.map((amenity) => (
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
                        className="capitalize"
                      >
                        {amenity.replace(/_/g, " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOfferDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateOffer}
              disabled={createOfferMutation.isPending}
            >
              {createOfferMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer l'offre"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
