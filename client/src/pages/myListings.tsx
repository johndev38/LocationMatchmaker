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
  Home,
  Plus,
  Clock,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Info,
  ChevronDown,
  CheckCircle,
  Map as MapIcon
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import useEmblaCarousel from "embla-carousel-react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from "@react-google-maps/api";

// Définir les bibliothèques Google Maps comme constante statique en dehors du composant
const googleMapsLibraries: Libraries = ["places"];

// Style personnalisé pour la carte
const mapContainerStyle = {
  width: '100%',
  height: '500px'
};

// Options par défaut pour la carte Google Maps
const defaultMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  scrollwheel: true,
  fullscreenControl: true,
};

interface Property {
  id?: number;
  title?: string;
  address: string;
  photos?: string[];
}

interface Offer {
  id: number;
  requestId: number;
  property?: Property;
  propertyId?: number;
  status: 'pending' | 'accepted' | 'rejected';
  price: number;
  description: string;
  availableAmenities?: string[];
  landlordId?: number;
  owner?: {
    id?: number;
    name: string;
    avatar?: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface RentalListing {
  id: number;
  status: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  maxDistance: number;
  maxBudget: number;
  locationType: string[];
  amenities: string[];
}

export default function MyListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all-offers");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhotoOffer, setSelectedPhotoOffer] = useState<Offer | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex: currentPhotoIndex });
  const [showOffersList, setShowOffersList] = useState(true);
  const [showListingsSection, setShowListingsSection] = useState(false);
  const [expandedListings, setExpandedListings] = useState<Record<number, boolean>>({});
  const [selectedMapOffer, setSelectedMapOffer] = useState<Offer | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [geocodedOffers, setGeocodedOffers] = useState<Offer[]>([]);

  // Chargement de l'API Google Maps
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    libraries: googleMapsLibraries,
  });

  // Fonction pour ouvrir la carte
  const openMapDialog = (offer: Offer) => {
    setSelectedMapOffer(offer);
    setMapDialogOpen(true);
  };

  // Fonction pour convertir une adresse en coordonnées géographiques
  const geocodeAddress = useCallback(async (address: string): Promise<{lat: number, lng: number} | null> => {
    if (!isLoaded || loadError) return null;
    
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });
      
      if (result && result[0] && result[0].geometry?.location) {
        const location = result[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
      return null;
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      return null;
    }
  }, [isLoaded, loadError]);

  // Fonction pour basculer l'état d'expansion d'une annonce
  const toggleListingExpansion = (listingId: number) => {
    setExpandedListings(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  // Mettre à jour le carousel lorsque l'index change
  useEffect(() => {
    if (emblaApi && photoGalleryOpen) {
      emblaApi.scrollTo(currentPhotoIndex);
    }
  }, [emblaApi, currentPhotoIndex, photoGalleryOpen]);

  // Écouter les changements de slide du carousel
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentPhotoIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

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
        userListings.map(async (listing: RentalListing) => {
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

  // Géocodage des adresses des offres quand les données sont chargées
  useEffect(() => {
    if (!isLoaded || loadError || allPropertyOffers.length === 0) return;
    
    const geocodeOffers = async () => {
      const offersWithCoordinates = await Promise.all(
        allPropertyOffers.map(async (offer) => {
          if (offer.property?.address && !offer.coordinates) {
            const coordinates = await geocodeAddress(offer.property.address);
            return { ...offer, coordinates };
          }
          return offer;
        })
      );
      
      setGeocodedOffers(offersWithCoordinates);
    };
    
    geocodeOffers();
  }, [isLoaded, loadError, allPropertyOffers, geocodeAddress]);

  // Mutation pour mettre à jour le statut d'une offre
  const updateOfferStatusMutation = useMutation({
    mutationFn: async ({ offerId, status }: { offerId: number; status: string }) => {
      // Vérifier que l'utilisateur est connecté
      if (!user) {
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }

      try {
        // D'abord mettre à jour le statut de l'offre
        const updateResponse = await apiRequest("PUT", `/api/property-offers/${offerId}/status`, {
          status,
        });

        if (!updateResponse.ok) {
          // Récupérer le message d'erreur précis du serveur si disponible
          const errorData = await updateResponse.json().catch(() => null);
          throw new Error(errorData?.message || `Erreur HTTP ${updateResponse.status}`);
        }

        const updatedOffer = await updateResponse.json();
        
        // Journaliser l'offre mise à jour pour débogage
        console.log("Offre mise à jour:", updatedOffer);
        
        // Récupérer l'ID de propriété soit de l'offre mise à jour, soit de l'offre originale (sélectionnée)
        const originalOffer = allPropertyOffers.find(o => o.id === offerId);
        console.log("Offre originale:", originalOffer);
        
        // Récupérer l'ID de la propriété correctement
        let propertyId = updatedOffer.propertyId;
        
        // Si l'ID n'est pas directement dans l'offre, chercher dans l'objet property
        if (!propertyId && updatedOffer.property && updatedOffer.property.id) {
          propertyId = updatedOffer.property.id;
          console.log("ID de propriété trouvé dans property.id:", propertyId);
        }
        
        // Fallback à l'offre originale si nécessaire
        if (!propertyId && originalOffer && originalOffer.propertyId) {
          propertyId = originalOffer.propertyId;
          console.log("ID de propriété trouvé dans l'offre originale:", propertyId);
        } else if (!propertyId && originalOffer && originalOffer.property && originalOffer.property.id) {
          propertyId = originalOffer.property.id;
          console.log("ID de propriété trouvé dans property.id de l'offre originale:", propertyId);
        }
        
        // Si toujours pas d'ID, utiliser une valeur par défaut avec avertissement
        if (!propertyId) {
          console.warn("Aucun ID de propriété trouvé - utilisation d'un ID par défaut (1)");
          propertyId = 1;
        }
        
        // Récupérer l'ID du propriétaire aussi
        let landlordId = updatedOffer.landlordId;
        
        if (!landlordId && updatedOffer.owner && updatedOffer.owner.id) {
          landlordId = updatedOffer.owner.id;
        } else if (!landlordId && originalOffer && originalOffer.landlordId) {
          landlordId = originalOffer.landlordId;
        } else if (!landlordId && originalOffer && originalOffer.owner && originalOffer.owner.id) {
          landlordId = originalOffer.owner.id;
        } else {
          console.warn("Aucun ID de propriétaire trouvé - utilisation d'un ID par défaut (1)");
          landlordId = 1;
        }
        
        console.log("ID du propriétaire trouvé:", landlordId);
        console.log("ID de la propriété trouvé:", propertyId);

        // Si l'offre est acceptée, créer une réservation entre les deux parties
        if (status === "accepted") {
          // Trouver la demande associée à cette offre
          const relatedListing = userListings.find((l: RentalListing) => l.id === originalOffer?.requestId);
          
          // Récupérer le landlordId directement de l'offre mise à jour
          const correctLandlordId = updatedOffer.landlordId || originalOffer?.landlordId;
          
          if (!correctLandlordId) {
            console.error("Aucun landlordId trouvé dans l'offre", updatedOffer, originalOffer);
            toast({
              title: "Erreur",
              description: "Impossible de créer la réservation: ID du propriétaire introuvable",
              variant: "destructive",
            });
            return updatedOffer;
          }
          
          // S'assurer que le propertyId est correct
          let correctPropertyId = propertyId;
          
          // Dernière vérification - si l'offre contient directement l'ID de la propriété dans property.id
          if (originalOffer?.property?.id) {
            correctPropertyId = originalOffer.property.id;
            console.log("ID de propriété corrigé depuis l'offre originale:", correctPropertyId);
          }
          
          if (!correctPropertyId) {
            console.error("Aucun propertyId valide trouvé");
            toast({
              title: "Erreur",
              description: "Impossible de créer la réservation: ID de la propriété introuvable",
              variant: "destructive",
            });
            return updatedOffer;
          }
          
          // Préparer les données de réservation avec les ID corrects
          const reservationData = {
            offerId: offerId,
            tenantId: user.id,
            landlordId: correctLandlordId,
            totalPrice: updatedOffer.price || (originalOffer && originalOffer.price) || 0,
            propertyId: correctPropertyId,
            startDate: relatedListing?.startDate || new Date().toISOString(),
            endDate: relatedListing?.endDate || new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            specialRequests: "" // Champ requis par la structure
          };
          
          // Journaliser les données de la réservation avant envoi
          console.log("Données de la réservation à créer:", reservationData);
          
          try {
            // Débuter par mettre à jour l'URL avec le protocole et le domaine complets
            const baseUrl = window.location.origin; // ex: http://localhost:5000
            const reservationUrl = `${baseUrl}/api/reservations`;
            
            console.log("URL complète pour la création de réservation:", reservationUrl);
            
            // Créer la réservation avec fetch directement au lieu d'utiliser apiRequest
            const reservationResponse = await fetch(reservationUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Important pour l'authentification par cookie
              body: JSON.stringify(reservationData)
            });
            
            if (!reservationResponse.ok) {
              console.error("Réponse d'erreur:", reservationResponse.status, reservationResponse.statusText);
              
              // Essayer de lire le corps même en cas d'erreur
              let errorData;
              try {
                const textResponse = await reservationResponse.text();
                console.log("Réponse d'erreur brute:", textResponse);
                
                try {
                  // Essayer de parser comme JSON si possible
                  errorData = JSON.parse(textResponse);
                } catch (e) {
                  // Si ce n'est pas du JSON, utiliser le texte brut
                  errorData = { error: "Erreur serveur", message: textResponse };
                }
              } catch (e) {
                console.error("Impossible de lire la réponse d'erreur:", e);
                errorData = { error: "Erreur inconnue", message: "Impossible de lire la réponse d'erreur" };
              }
              
              // Gestion spécifique des erreurs connues
              if (errorData.error === "PROPERTY_ALREADY_RESERVED") {
                toast({
                  title: "Réservation impossible",
                  description: "Cette propriété est déjà réservée pour cette période.",
                  variant: "destructive",
                });
                return { updatedOffer, reservation: null };
              }
              
              // Gestion générique des erreurs
              toast({
                title: "Erreur",
                description: errorData.message || `Erreur ${reservationResponse.status}: ${reservationResponse.statusText}`,
                variant: "destructive",
              });
              throw new Error(errorData?.message || "Erreur lors de la création de la réservation");
            }
            
            // En cas de succès
            const reservation = await reservationResponse.json();
            toast({
              title: "Réservation créée",
              description: "La réservation a été créée avec succès!",
            });
            
            // Rediriger vers la page des réservations
            setTimeout(() => {
              window.location.href = "/reservations";
            }, 1000);
            
            return { updatedOffer, reservation };
          } catch (error) {
            console.error("Erreur lors de la création de la réservation:", error);
            toast({
              title: "Erreur",
              description: "Une erreur inattendue s'est produite",
              variant: "destructive",
            });
            return { updatedOffer, reservation: null };
          }
        }

        return updatedOffer;
      } catch (error) {
        console.error("Erreur lors de la mise à jour de l'offre:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allPropertyOffers"] });
      
      if (data && data.reservation) {
        toast({
          title: "Offre acceptée",
          description: "Une réservation a été créée entre vous et le propriétaire. Vous pouvez la consulter dans la section 'Mes réservations'.",
        });
      } else {
        toast({
          title: "Offre mise à jour",
          description: "Le statut de l'offre a été mis à jour avec succès",
        });
      }
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
  const filteredListings = userListings.filter((listing: RentalListing) => {
    if (activeTab === "active-listings") return listing.status === "active";
    if (activeTab === "inactive-listings") return listing.status === "inactive" || listing.status === "expired";
    return true; // Pour les autres onglets, on montre tout
  });

  // Filtrer les offres selon l'onglet actif
  const filteredOffers = allPropertyOffers.filter((offer: Offer) => {
    if (activeTab === "pending-offers") return offer.status === "pending";
    if (activeTab === "accepted-offers") return offer.status === "accepted";
    if (activeTab === "rejected-offers") return offer.status === "rejected";
    if (selectedRequestId) return offer.requestId === selectedRequestId;
    return true; // 'all-offers' tab
  });

  // Trouver l'offre sélectionnée
  const selectedOffer = selectedOfferId
    ? allPropertyOffers.find((offer: Offer) => offer.id === selectedOfferId)
    : null;
    
  // Trouver la demande correspondant à l'offre sélectionnée
  const selectedListing = selectedOffer
    ? userListings.find((listing: RentalListing) => listing.id === selectedOffer.requestId)
    : null;

  // Fonction pour sélectionner une offre
  const handleSelectOffer = (offerId: number) => {
    setSelectedOfferId(offerId === selectedOfferId ? null : offerId);
  };

  // Fonction pour ouvrir la galerie photo
  const openPhotoGallery = (offer: Offer, index = 0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPhotoOffer(offer);
    setCurrentPhotoIndex(index);
    setPhotoGalleryOpen(true);
  };

  // Regrouper les offres par demande
  const offersByListing = userListings.reduce((acc: Record<number, Offer[]>, listing: RentalListing) => {
    acc[listing.id] = allPropertyOffers.filter((offer: Offer) => offer.requestId === listing.id);
    return acc;
  }, {});

  // Compter les offres par statut
  const offerCounts = {
    all: allPropertyOffers.length,
    pending: allPropertyOffers.filter((offer: Offer) => offer.status === "pending").length,
    accepted: allPropertyOffers.filter((offer: Offer) => offer.status === "accepted").length,
    rejected: allPropertyOffers.filter((offer: Offer) => offer.status === "rejected").length
  };

  // Fonction pour confirmer l'acceptation de l'offre
  const confirmAcceptOffer = (offerId: number) => {
    if (confirm("Êtes-vous sûr de vouloir accepter cette offre ? Une réservation sera créée entre vous et le propriétaire.")) {
      updateOfferStatusMutation.mutate({ offerId, status: "accepted" });
      setSelectedOfferId(null);
    }
  };

  if (loadingListings || loadingOffers) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    );
  }

  const hasOffers = allPropertyOffers.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      {/* Photo Gallery Dialog */}
      <Dialog open={photoGalleryOpen} onOpenChange={setPhotoGalleryOpen}>
        <DialogContent className="sm:max-w-4xl p-0 bg-black/95" aria-describedby="photo-gallery-description">
          <div className="sr-only" id="photo-gallery-description">Galerie photos de la propriété</div>
          <div className="sr-only">
            <DialogTitle>Photos de la propriété</DialogTitle>
          </div>
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setPhotoGalleryOpen(false)} 
              className="absolute top-4 right-4 z-50 rounded-full bg-black/70 border-none text-white hover:bg-black/90"
            >
              <XCircle className="h-5 w-5" />
            </Button>
            
            {selectedPhotoOffer?.property?.photos && selectedPhotoOffer.property.photos.length > 0 && (
              <div className="w-full overflow-hidden">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {selectedPhotoOffer.property.photos.map((photo: string, index: number) => (
                      <div 
                        key={index} 
                        className="min-w-0 flex-[0_0_100%] h-[80vh] relative"
                      >
                        <img
                          src={photo}
                          alt={`Photo ${index + 1} de la propriété`}
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                  onClick={() => emblaApi?.scrollPrev()}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <Button 
                  variant="outline" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 z-10"
                  onClick={() => emblaApi?.scrollNext()}
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            )}
            
            {/* Compteur de photos */}
            {selectedPhotoOffer?.property?.photos && selectedPhotoOffer.property.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-white text-sm">
                {currentPhotoIndex + 1} / {selectedPhotoOffer.property.photos.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Map Dialog */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className="sm:max-w-4xl p-4">
          <DialogTitle className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-pink-500" />
            {selectedMapOffer?.property?.title || "Adresse de la propriété"}
          </DialogTitle>
          
          {isLoaded && selectedMapOffer?.coordinates ? (
            <div className="rounded-xl overflow-hidden border">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedMapOffer.coordinates}
                zoom={15}
                options={{
                  ...defaultMapOptions,
                  mapTypeControl: true,
                  streetViewControl: true,
                  mapTypeControlOptions: {
                    position: google.maps.ControlPosition.TOP_RIGHT,
                  },
                  zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                  }
                }}
              >
                <Marker
                  position={selectedMapOffer.coordinates}
                  title={selectedMapOffer.property?.title || "Propriété"}
                  animation={google.maps.Animation.DROP}
                />
              </GoogleMap>
              <div className="p-4 bg-gray-50 text-gray-700 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pink-500 flex-shrink-0" />
                <span className="font-medium">{selectedMapOffer.property?.address || "Adresse non disponible"}</span>
              </div>
            </div>
          ) : (
            <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-lg">
              {loadError ? (
                <div className="text-red-500">Erreur de chargement de la carte</div>
              ) : !isLoaded ? (
                <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
              ) : (
                <div className="text-gray-500">Coordonnées non disponibles pour cette adresse</div>
              )}
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMapDialogOpen(false)}>
              Fermer
            </Button>
            {selectedMapOffer?.coordinates && (
              <Button 
                className="bg-pink-600 hover:bg-pink-700"
                onClick={() => {
                  if (selectedMapOffer.coordinates) {
                    const url = `https://www.google.com/maps/search/?api=1&query=${selectedMapOffer.coordinates.lat},${selectedMapOffer.coordinates.lng}`;
                    window.open(url, '_blank');
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans Google Maps
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Mes recherches et offres
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez vos recherches de logement et consultez les offres associées
            </p>
          </div>
          <Button className="bg-pink-600 hover:bg-pink-700">
            <a href="/create-request" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle recherche
            </a>
          </Button>
        </div>

        {userListings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="bg-pink-50 inline-flex rounded-full p-4 mb-4">
                <Home className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune recherche de logement</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">Créez votre première demande pour recevoir des offres de propriétaires adaptées à vos besoins</p>
              <Button asChild className="bg-pink-600 hover:bg-pink-700">
                <a href="/create-request" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Créer ma première demande
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userListings.map((listing: RentalListing) => {
              const listingOffers = offersByListing[listing.id] || [];
              const isExpanded = expandedListings[listing.id] || false;
              
              return (
                <div key={listing.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Résumé de l'annonce en une ligne */}
                  <Collapsible open={isExpanded} onOpenChange={() => toggleListingExpansion(listing.id)}>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" 
                         onClick={() => toggleListingExpansion(listing.id)}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="rounded-full p-2 bg-pink-50 flex-shrink-0">
                          <MapPin className="h-5 w-5 text-pink-500" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-gray-800 truncate">
                              {listing.departureCity}
                            </h3>
                            <Badge className={listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                              {listing.status === 'active' ? 'Active' : 'Terminée'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {listing.adults} adultes
                            {listing.children > 0 && `, ${listing.children} enfants`}
                            {listing.babies > 0 && `, ${listing.babies} bébés`}
                            {listing.pets > 0 && `, ${listing.pets} animaux`}
                            • {listing.maxDistance} km • {listing.maxBudget} €
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-pink-50 text-pink-700 rounded-full flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {listingOffers.length} offres
                        </Badge>
                        <CollapsibleTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    
                    <CollapsibleContent>
                      {/* Détails de l'annonce */}
                      <div className="px-6 pt-2 pb-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Calendar className="h-4 w-4" /> Dates
                            </p>
                            <p className="mt-1 font-medium">
                              {new Date(listing.startDate).toLocaleDateString('fr-FR')} - {new Date(listing.endDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Users className="h-4 w-4" /> Voyageurs
                            </p>
                            <p className="mt-1 font-medium">
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
                            <p className="mt-1 font-medium">{listing.maxDistance} km</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Euro className="h-4 w-4" /> Budget max
                            </p>
                            <p className="mt-1 font-medium">{listing.maxBudget} €</p>
                          </div>
                        </div>

                        {listing.amenities && listing.amenities.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Prestations souhaitées
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {listing.amenities.map((amenity: string) => (
                                <Badge 
                                  key={amenity}
                                  variant="outline"
                                  className="capitalize bg-gray-50"
                                >
                                  {amenity.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
                                deleteRequestMutation.mutate(listing.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Supprimer cette recherche
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Liste des offres pour cette annonce */}
                  <div className="border-t border-gray-200">
                    {listingOffers.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <p className="mb-2">Aucune offre reçue pour cette recherche</p>
                        <p className="text-sm">Les propriétaires vous contacteront dès qu'ils auront des logements qui correspondent à vos critères</p>
                      </div>
                    ) : (
                      <div className="p-4">
                        <h4 className="font-medium text-gray-800 px-2 mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-pink-500" /> 
                          {listingOffers.length} offres reçues
                        </h4>
                        <div className="space-y-4">
                          {listingOffers.map((offer: Offer) => {
                            const matchCount = listing.amenities?.filter((amenity: string) => 
                              offer.availableAmenities?.includes(amenity)
                            ).length || 0;
                            const totalCount = listing.amenities?.length || 0;
                            const percentage = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;
                            
                            return (
                              <Card 
                                key={offer.id} 
                                className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all"
                              >
                                {/* Section photos en pleine largeur */}
                                {offer.property?.photos && offer.property.photos.length > 0 ? (
                                  <div 
                                    className="h-[400px] w-full bg-gray-100 relative cursor-pointer overflow-hidden group"
                                    onClick={(e) => openPhotoGallery(offer, 0, e)}
                                  >
                                    <img
                                      src={offer.property.photos[0]}
                                      alt="Aperçu de la propriété"
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    {offer.property.photos.length > 1 && (
                                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-2 rounded-full text-sm font-medium">
                                        Voir les {offer.property.photos.length} photos
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                      <span className="text-white text-lg font-medium">Voir toutes les photos</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-[400px] w-full bg-gray-100 flex items-center justify-center">
                                    <Home className="h-16 w-16 text-gray-300" />
                                  </div>
                                )}

                                <div className="w-full">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <h4 className="text-xl font-semibold text-gray-800">{offer.property?.title || "Propriété"}</h4>
                                        <p className="text-gray-600 flex items-center gap-1 mt-1">
                                          <MapPin className="h-4 w-4" />
                                          {offer.property?.address}
                                          {isLoaded && geocodedOffers.find(o => o.id === offer.id)?.coordinates && (
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-6 px-2 py-0 ml-1 text-pink-600"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                const offerWithCoords = geocodedOffers.find(o => o.id === offer.id);
                                                if (offerWithCoords) {
                                                  openMapDialog(offerWithCoords);
                                                }
                                              }}
                                            >
                                              <MapIcon className="h-3 w-3 mr-1" />
                                              Voir sur la carte
                                            </Button>
                                          )}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-pink-600">{offer.price} €</p>
                                        <Badge
                                          className={
                                            offer.status === "accepted"
                                              ? "bg-green-100 text-green-800"
                                              : offer.status === "rejected"
                                              ? "bg-rose-100 text-rose-800"
                                              : "bg-orange-100 text-orange-800"
                                          }
                                        >
                                          {offer.status === "pending"
                                            ? "En attente"
                                            : offer.status === "accepted"
                                            ? "Acceptée"
                                            : "Refusée"}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="mb-4">
                                      <p className="text-sm text-gray-700">{offer.description}</p>
                                    </div>
                                    
                                    {/* Miniature de carte si les coordonnées sont disponibles */}
                                    {isLoaded && geocodedOffers.find(o => o.id === offer.id)?.coordinates && (
                                      <div 
                                        className="mb-4 rounded-md overflow-hidden border border-gray-200 h-[300px] relative cursor-pointer"
                                        onClick={() => {
                                          const offerWithCoords = geocodedOffers.find(o => o.id === offer.id);
                                          if (offerWithCoords) {
                                            openMapDialog(offerWithCoords);
                                          }
                                        }}
                                      >
                                        <GoogleMap
                                          mapContainerStyle={{ width: '100%', height: '100%' }}
                                          center={geocodedOffers.find(o => o.id === offer.id)?.coordinates}
                                          zoom={14}
                                          options={{
                                            ...defaultMapOptions,
                                            disableDefaultUI: true,
                                            zoomControl: false,
                                            scrollwheel: false,
                                            fullscreenControl: false,
                                            clickableIcons: false,
                                            draggable: false
                                          }}
                                        >
                                          <Marker
                                            position={geocodedOffers.find(o => o.id === offer.id)?.coordinates!}
                                          />
                                        </GoogleMap>
                                        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-2 text-xs font-medium text-center">
                                          Cliquez pour agrandir la carte
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Compteur de correspondance */}
                                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                                      <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-medium text-gray-700">Satisfaction de vos critères</p>
                                        <p className={`text-sm font-semibold ${
                                          percentage >= 80 ? 'text-green-600' : 
                                          percentage >= 50 ? 'text-amber-600' : 
                                          'text-red-600'
                                        }`}>
                                          {matchCount}/{totalCount} ({percentage}%)
                                        </p>
                                      </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            percentage >= 80 ? 'bg-green-500' : 
                                            percentage >= 50 ? 'bg-amber-500' : 
                                            'bg-red-500'
                                          }`} 
                                          style={{ width: `${percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>

                                    {/* Aménités qui correspondent */}
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Aménités disponibles</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {listing.amenities && listing.amenities.map((amenity: string) => {
                                          const isIncluded = offer.availableAmenities?.includes(amenity);
                                          return (
                                            <Badge
                                              key={amenity}
                                              variant="outline"
                                              className={`capitalize text-xs inline-flex items-center gap-1 ${isIncluded 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                            >
                                              {isIncluded ? (
                                                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                                              ) : (
                                                <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                              )}
                                              {amenity.replace(/_/g, " ")}
                                            </Badge>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    
                                    {offer.status === "pending" && (
                                      <div className="flex justify-end gap-2 mt-4">
                                        <Button 
                                          variant="outline"
                                          className="text-sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Êtes-vous sûr de vouloir refuser cette offre ?")) {
                                              updateOfferStatusMutation.mutate({ 
                                                offerId: offer.id, 
                                                status: "rejected" 
                                              });
                                            }
                                          }}
                                          disabled={updateOfferStatusMutation.isPending}
                                        >
                                          {updateOfferStatusMutation.isPending && updateOfferStatusMutation.variables?.offerId === offer.id && updateOfferStatusMutation.variables?.status === "rejected" ? (
                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                          ) : "Refuser"}
                                        </Button>
                                        <Button 
                                          className="text-sm bg-pink-600 hover:bg-pink-700"
                                          onClick={() => confirmAcceptOffer(offer.id)}
                                          disabled={updateOfferStatusMutation.isPending}
                                        >
                                          {updateOfferStatusMutation.isPending && updateOfferStatusMutation.variables?.offerId === offer.id && updateOfferStatusMutation.variables?.status === "accepted" ? (
                                            <>
                                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> 
                                              Traitement...
                                            </>
                                          ) : "Accepter"}
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {offer.status === "accepted" && (
                                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                        <div className="flex items-center gap-2 mb-1">
                                          <CheckCircle className="h-4 w-4" />
                                          <span className="font-medium">
                                            Vous avez accepté cette offre. Une réservation a été créée.
                                          </span>
                                        </div>
                                        <div className="ml-6">
                                          <a href="/reservations">Voir mes réservations</a>
                                        </div>
                                      </div>
                                    )}
                                  </CardContent>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
