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
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import useEmblaCarousel from "embla-carousel-react";

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
  const [activeTab, setActiveTab] = useState("active");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [selectedPhotoOffer, setSelectedPhotoOffer] = useState<Offer | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex: currentPhotoIndex });

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
  const filteredListings = userListings.filter((listing: RentalListing) => {
    if (activeTab === "active") return listing.status === "active";
    if (activeTab === "inactive") return listing.status === "inactive" || listing.status === "expired";
    return true; // 'all' tab
  });

  // Si une demande est sélectionnée, filtrer pour n'afficher que ses offres
  const displayedOffers = selectedRequestId 
    ? allPropertyOffers.filter((offer: Offer) => offer.requestId === selectedRequestId)
    : allPropertyOffers;

  // Trouver l'offre sélectionnée
  const selectedOffer = selectedOfferId
    ? displayedOffers.find((offer: Offer) => offer.id === selectedOfferId)
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

      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Mes recherches de logement
            </h1>
            <p className="text-gray-500 mt-1">
              Gérez vos demandes et consultez les offres de propriétaires
            </p>
          </div>
          <Button className="bg-pink-600 hover:bg-pink-700">
            <a href="/create-request" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle demande
            </a>
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
              <TabsTrigger value="active" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Actives</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="inactive" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <span>Terminées</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Toutes</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                {filteredListings.length} {filteredListings.length > 1 ? 'demandes trouvées' : 'demande trouvée'}
              </p>
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-400">Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {userListings.length === 0 ? (
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
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">Aucune demande {activeTab === "active" ? "active" : activeTab === "inactive" ? "terminée" : ""}</p>
                {activeTab !== "active" && (
                  <Button asChild className="bg-pink-600 hover:bg-pink-700">
                    <a href="/create-request" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Créer une nouvelle demande
                    </a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredListings.map((listing: RentalListing) => {
                  const listingOffers = allPropertyOffers.filter((o: Offer) => o.requestId === listing.id);
                  
                  return (
                    <Card 
                      key={listing.id} 
                      className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow ${selectedRequestId === listing.id ? 'ring-2 ring-pink-500 ring-opacity-50' : ''}`}
                    >
                      <CardHeader className="pb-3 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="rounded-full p-2 bg-pink-50 flex-shrink-0">
                              <MapPin className="h-5 w-5 text-pink-500" />
                            </div>
                            <div>
                              <CardTitle className="text-xl font-semibold text-gray-800">
                                {listing.departureCity}
                              </CardTitle>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <Badge className={listing.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                                  {listing.status === 'active' ? 'Active' : 'Terminée'}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(listing.startDate).toLocaleDateString('fr-FR')} - {new Date(listing.endDate).toLocaleDateString('fr-FR')}
                                </span>
                              </div>
                            </div>
                          </div>
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
                            <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="py-4">
                        {/* Détails de la demande */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                          <div>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                              <Home className="h-4 w-4" /> Type de location
                            </p>
                            <p className="mt-1 font-medium">{listing.locationType.join(", ")}</p>
                          </div>
                        </div>

                        {/* Prestations souhaitées */}
                        {listing.amenities && listing.amenities.length > 0 && (
                          <div className="mb-6">
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
                      </CardContent>

                      <CardFooter className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
                        <div className="text-sm flex items-center gap-2">
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 rounded-full">
                            {listingOffers.length}
                          </Badge>
                          <span>offres reçues</span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setSelectedRequestId(selectedRequestId === listing.id ? null : listing.id)}
                        >
                          {selectedRequestId === listing.id ? "Masquer les offres" : "Voir les offres"}
                          <ChevronRight className={`h-4 w-4 transition-transform ${selectedRequestId === listing.id ? 'rotate-90' : ''}`} />
                        </Button>
                      </CardFooter>

                      {/* Section des offres reçues (visible seulement si cette demande est sélectionnée) */}
                      {selectedRequestId === listing.id && (
                        <div className="border-t px-6 py-5 bg-white">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-pink-500" />
                            Offres reçues
                          </h3>
                          {loadingOffers ? (
                            <div className="flex justify-center py-8">
                              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                            </div>
                          ) : listingOffers.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-600 mb-2">Aucune offre reçue pour cette demande</p>
                              <p className="text-gray-500 text-sm">Les propriétaires vous contacteront dès qu'ils auront des logements qui correspondent à vos critères</p>
                            </div>
                          ) : (
                            <div className="space-y-8">
                              {/* Grille des offres simplifiées */}
                              <div className="grid grid-cols-1 gap-4">
                                {listingOffers.map((offer: Offer) => {
                                  const isSelected = selectedOfferId === offer.id;
                                  const matchCount = listing.amenities?.filter((amenity: string) => 
                                    offer.availableAmenities?.includes(amenity)
                                  ).length || 0;
                                  const totalCount = listing.amenities?.length || 0;
                                  const percentage = totalCount > 0 ? Math.round((matchCount / totalCount) * 100) : 0;
                                  
                                  return (
                                    <Card 
                                      key={offer.id} 
                                      className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-500' : ''}`}
                                      onClick={() => handleSelectOffer(offer.id)}
                                    >
                                      <div className="flex flex-col md:flex-row">
                                        {/* Miniature de photo */}
                                        {offer.property?.photos && offer.property.photos.length > 0 ? (
                                          <div 
                                            className="h-48 md:w-1/4 bg-gray-100 relative cursor-pointer overflow-hidden group"
                                            onClick={(e) => openPhotoGallery(offer, 0, e)}
                                          >
                                            <img
                                              src={offer.property.photos[0]}
                                              alt="Aperçu de la propriété"
                                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                            {offer.property.photos.length > 1 && (
                                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                +{offer.property.photos.length - 1}
                                              </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                              <span className="text-white text-sm font-medium">Voir les photos</span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="h-48 md:w-1/4 bg-gray-100 flex items-center justify-center">
                                            <Home className="h-10 w-10 text-gray-300" />
                                          </div>
                                        )}

                                        <div className="md:w-3/4">
                                          <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                              <div>
                                                <h4 className="text-xl font-semibold text-gray-800">{offer.property?.title || "Propriété"}</h4>
                                                <p className="text-gray-600 flex items-center gap-1 mt-1">
                                                  <MapPin className="h-4 w-4" />
                                                  {offer.property?.address}
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
                                                    updateOfferStatusMutation.mutate({ 
                                                      offerId: offer.id, 
                                                      status: "rejected" 
                                                    });
                                                  }}
                                                >
                                                  Refuser
                                                </Button>
                                                <Button 
                                                  className="text-sm bg-pink-600 hover:bg-pink-700"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateOfferStatusMutation.mutate({ 
                                                      offerId: offer.id, 
                                                      status: "accepted" 
                                                    });
                                                  }}
                                                >
                                                  Accepter
                                                </Button>
                                              </div>
                                            )}
                                          </CardContent>
                                        </div>
                                      </div>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
