import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Plus, X, Wifi, Tv, Car, Home, UtensilsCrossed, Trees, Waves, Droplets,
  WashingMachine, Bath, Bed, DoorOpen, Fan, Footprints, Gamepad2, Key, Laptop,
  Microwave, Mountain, ParkingCircle, Shirt, Snowflake, Sofa, Sun, Thermometer,
  Dumbbell, Baby, Dog, Coffee, Cigarette, ShowerHead, MapPin
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";

type Property = {
  id: number;
  title: string;
  description: string;
  address: string;
  photos: string[];
  amenities: string[];
  coordinates?: { lat: number; lng: number };
};

// Type pour les photos à prévisualiser
type PreviewPhoto = {
  file: File;
  preview: string;
};

export default function MyProperty() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PreviewPhoto[]>([]);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [coordinates, setCoordinates] = useState<{lat: number; lng: number} | null>(null);

  // Configuration de l'API Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    libraries: ["places"],
  });

  // Gestion de la sélection d'adresse via Google Places
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        setCoordinates({
          lat: location?.lat() || 0,
          lng: location?.lng() || 0,
        });
        setAddress(place.formatted_address || "");
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de trouver l'adresse.",
          variant: "destructive",
        });
      }
    }
  };

  const amenitiesList = [
    // Vue et Localisation
    { id: "vue_baie", label: "Vue sur la baie", icon: <Home className="h-5 w-5" />, category: "Vue et Localisation" },
    { id: "vue_jardin", label: "Vue sur le jardin", icon: <Trees className="h-5 w-5" />, category: "Vue et Localisation" },
    { id: "vue_montagne", label: "Vue montagne", icon: <Mountain className="h-5 w-5" />, category: "Vue et Localisation" },
    { id: "acces_plage", label: "Accès plage ou bord de mer", icon: <Waves className="h-5 w-5" />, category: "Vue et Localisation" },
    { id: "centre_ville", label: "Proximité centre-ville", icon: <Home className="h-5 w-5" />, category: "Vue et Localisation" },

    // Équipements essentiels
    { id: "wifi", label: "Wifi", icon: <Wifi className="h-5 w-5" />, category: "Essentiels" },
    { id: "cuisine", label: "Cuisine équipée", icon: <UtensilsCrossed className="h-5 w-5" />, category: "Essentiels" },
    { id: "cuisine_partagee", label: "Cuisine partagée", icon: <UtensilsCrossed className="h-5 w-5" />, category: "Essentiels" },
    { id: "salle_bain_privee", label: "Salle de bain privée", icon: <Bath className="h-5 w-5" />, category: "Essentiels" },
    { id: "salle_bain_partagee", label: "Salle de bain partagée", icon: <Bath className="h-5 w-5" />, category: "Essentiels" },
    { id: "chambre_privee", label: "Chambre privée", icon: <Bed className="h-5 w-5" />, category: "Essentiels" },
    { id: "entree_privee", label: "Entrée privée", icon: <DoorOpen className="h-5 w-5" />, category: "Essentiels" },

    // Stationnement
    { id: "parking", label: "Parking gratuit sur place", icon: <Car className="h-5 w-5" />, category: "Stationnement" },
    { id: "parking_rue", label: "Parking gratuit dans la rue", icon: <ParkingCircle className="h-5 w-5" />, category: "Stationnement" },
    { id: "parking_payant", label: "Parking payant", icon: <Car className="h-5 w-5" />, category: "Stationnement" },

    // Divertissement
    { id: "television", label: "Télévision", icon: <Tv className="h-5 w-5" />, category: "Divertissement" },
    { id: "console_jeux", label: "Console de jeux", icon: <Gamepad2 className="h-5 w-5" />, category: "Divertissement" },
    { id: "espace_travail", label: "Espace de travail", icon: <Laptop className="h-5 w-5" />, category: "Divertissement" },

    // Équipements de confort
    { id: "climatisation", label: "Climatisation", icon: <Snowflake className="h-5 w-5" />, category: "Confort" },
    { id: "chauffage", label: "Chauffage", icon: <Thermometer className="h-5 w-5" />, category: "Confort" },
    { id: "ventilateur", label: "Ventilateur", icon: <Fan className="h-5 w-5" />, category: "Confort" },

    // Installations
    { id: "piscine", label: "Piscine extérieure commune", icon: <Droplets className="h-5 w-5" />, category: "Installations" },
    { id: "jacuzzi", label: "Jacuzzi", icon: <Droplets className="h-5 w-5" />, category: "Installations" },
    { id: "salle_sport", label: "Salle de sport", icon: <Dumbbell className="h-5 w-5" />, category: "Installations" },
    { id: "terrasse", label: "Terrasse", icon: <Sun className="h-5 w-5" />, category: "Installations" },
    { id: "balcon", label: "Balcon", icon: <Sun className="h-5 w-5" />, category: "Installations" },
    { id: "jardin", label: "Jardin", icon: <Trees className="h-5 w-5" />, category: "Installations" },

    // Services
    { id: "lave_linge", label: "Lave-linge (Payant)", icon: <WashingMachine className="h-5 w-5" />, category: "Services" },
    { id: "seche_linge", label: "Sèche-linge (Payant)", icon: <WashingMachine className="h-5 w-5" />, category: "Services" },
    { id: "fer_repasser", label: "Fer à repasser", icon: <Shirt className="h-5 w-5" />, category: "Services" },
    { id: "micro_ondes", label: "Four micro-ondes", icon: <Microwave className="h-5 w-5" />, category: "Services" },
    { id: "cafetiere", label: "Cafetière", icon: <Coffee className="h-5 w-5" />, category: "Services" },

    // Caractéristiques
    { id: "adapte_bebe", label: "Adapté aux bébés", icon: <Baby className="h-5 w-5" />, category: "Caractéristiques" },
    { id: "animaux_acceptes", label: "Animaux acceptés", icon: <Dog className="h-5 w-5" />, category: "Caractéristiques" },
    { id: "fumeur_autorise", label: "Fumeur autorisé", icon: <Cigarette className="h-5 w-5" />, category: "Caractéristiques" },
    { id: "acces_handicape", label: "Accès handicapé", icon: <Footprints className="h-5 w-5" />, category: "Caractéristiques" },

    // Mobilier
    { id: "canape_lit", label: "Canapé-lit", icon: <Sofa className="h-5 w-5" />, category: "Mobilier" },
    { id: "lit_double", label: "Lit double", icon: <Bed className="h-5 w-5" />, category: "Mobilier" },
    { id: "lit_simple", label: "Lit simple", icon: <Bed className="h-5 w-5" />, category: "Mobilier" },
  ];

  const { data: property, isLoading, refetch } = useQuery<Property, Error>({
    queryKey: ["property"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/property");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des informations du bien");
      }
      return response.json();
    },
    enabled: user?.isLandlord,
  });

  // Effet pour initialiser les états avec les données récupérées
  useEffect(() => {
    if (property) {
      setTitle(property.title || "");
      setDescription(property.description || "");
      setAddress(property.address || "");
      setSelectedAmenities(property.amenities || []);
      if (property.coordinates) {
        setCoordinates(property.coordinates);
      }
    }
  }, [property]);

  // Nettoyer les prévisualisations à la destruction du composant
  useEffect(() => {
    return () => {
      // Libérer les URLs des prévisualisations
      pendingPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, [pendingPhotos]);

  // Effet pour rafraîchir les données quand le composant est monté
  useEffect(() => {
    // Récupérer les données fraîches à chaque montage du composant
    refetch();
  }, [refetch]);

  const updatePropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      // Si c'est un FormData, l'envoyer directement
      if (propertyData instanceof FormData) {
        const response = await apiRequest("PUT", "/api/property", propertyData);
        if (!response.ok)
          throw new Error("Erreur lors de la mise à jour du bien");
        return response.json();
      } else {
        // Sinon, envoyer comme JSON
        const response = await apiRequest("PUT", "/api/property", propertyData);
        if (!response.ok)
          throw new Error("Erreur lors de la mise à jour du bien");
        return response.json();
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Succès",
        description: "Les informations de votre bien ont été mises à jour",
      });
      setIsEditing(false);
      // Vider les photos en attente après sauvegarde réussie
      setPendingPhotos([]);
      
      // Invalidate the property query to force a refresh
      refetch();
      
      // Update local states with the returned data
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setAddress(data.address || "");
        setSelectedAmenities(data.amenities || []);
        if (data.coordinates) {
          setCoordinates(data.coordinates);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      const response = await apiRequest("DELETE", "/api/property/photos", { photoUrl });
      if (!response.ok)
        throw new Error("Erreur lors de la suppression de la photo");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "La photo a été supprimée",
      });
      
      // Force a refresh of the property data
      refetch();
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Vérifier le nombre total de photos (existantes + en attente + nouvelles)
    const totalPhotos = (property?.photos?.length || 0) + pendingPhotos.length + files.length;
    if (totalPhotos > 5) {
      toast({
        title: "Erreur",
        description: "Vous ne pouvez pas ajouter plus de 5 photos au total",
        variant: "destructive",
      });
      return;
    }

    // Créer les prévisualisations pour les nouvelles photos
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setPendingPhotos(prev => [...prev, ...newPhotos]);
    
    // Activer le mode édition automatiquement
    if (!isEditing) {
      setIsEditing(true);
    }
    
    // Réinitialiser l'input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const removePendingPhoto = (index: number) => {
    setPendingPhotos(prev => {
      // Libérer l'URL de la prévisualisation
      URL.revokeObjectURL(prev[index].preview);
      
      // Retourner un nouveau tableau sans la photo supprimée
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      const response = await apiRequest("DELETE", `/api/property/photo?url=${encodeURIComponent(photoUrl)}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la photo");
      }
      
      // Mettre à jour l'état local après la suppression réussie
      if (property) {
        property.photos = property.photos.filter(p => p !== photoUrl);
      }
      
      toast({
        title: "Succès",
        description: "La photo a été supprimée",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Vérifier que l'adresse est valide (coordonnées définies)
    if (!coordinates && address.trim() !== "") {
      toast({
        title: "Adresse invalide",
        description: "Veuillez sélectionner une adresse valide depuis les suggestions",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUploadingPhotos(true);
  
      // Données de la propriété
      const propertyData = {
        title,
        description,
        address,
        amenities: selectedAmenities,
        coordinates: coordinates
      };
      
      if (pendingPhotos.length > 0) {
        // Créer un FormData pour les photos et les données
        const formData = new FormData();
        formData.append('data', JSON.stringify(propertyData));
        
        // Ajouter les nouvelles photos
        pendingPhotos.forEach(photo => {
          formData.append('photos', photo.file);
        });
        
        await updatePropertyMutation.mutate(formData);
      } else {
        // Pas de nouvelles photos, envoyer directement les données JSON
        await updatePropertyMutation.mutate(propertyData);
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite",
        variant: "destructive",
      });
    } finally {
      setUploadingPhotos(false);
    }
  };

  const toggleAmenity = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  if (!user?.isLandlord) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="text-center">
            Cette page est réservée aux propriétaires
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-20">
        <h1 className="text-3xl font-bold mb-6">Ma Location</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Informations du bien</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Annuler" : "Modifier"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Titre de l'annonce</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Ex: Maison de charme avec jardin"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  {isLoaded ? (
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <Autocomplete
                        onLoad={(autocomplete) => setAutocomplete(autocomplete)}
                        onPlaceChanged={handlePlaceChanged}
                        options={{ fields: ["formatted_address", "geometry"] }}
                      >
                        <Input
                          id="address"
                          ref={addressInputRef}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Entrez l'adresse complète"
                          className="pl-10"
                          required
                        />
                      </Autocomplete>
                    </div>
                  ) : (
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Chargement de Google Maps..."
                      disabled
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">Sélectionnez une adresse dans les suggestions pour valider</p>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditing}
                    rows={6}
                    placeholder="Décrivez votre bien en détail..."
                  />
                </div>

                {isEditing && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={updatePropertyMutation.isPending || uploadingPhotos}
                  >
                    {updatePropertyMutation.isPending || uploadingPhotos ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Enregistrer les modifications"
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Photos</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhotos || (!isEditing && pendingPhotos.length === 0)}
                  >
                    {uploadingPhotos ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter des photos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingPhotos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Photos à ajouter :</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingPhotos.map((photo, index) => (
                      <div key={`pending-${index}`} className="relative group">
                        <img
                          src={photo.preview}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg border-2 border-pink-200"
                        />
                        <button
                          onClick={() => removePendingPhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {property && property.photos && property.photos.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-3">Photos actuelles :</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {property.photos.map((photo, index) => {
                      // S'assurer que l'URL de la photo est complète et pointe vers le bon serveur
                      // Le serveur Express tourne sur le port 5000
                      const serverBaseUrl = 'http://localhost:5000';
                      const photoUrl = photo.startsWith('http') 
                        ? photo 
                        : photo.startsWith('/') 
                          ? `${serverBaseUrl}${photo}` 
                          : `${serverBaseUrl}/${photo}`;
                      
                      console.log("URL de la photo:", photoUrl);
                      
                      return (
                        <div key={`existing-${index}`} className="relative group">
                          <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={photoUrl}
                              alt={`Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error(`Erreur de chargement d'image: ${photoUrl}`);
                                // Créer une URL de remplacement avec un timestamp pour éviter la mise en cache
                                const fallbackUrl = `${serverBaseUrl}/uploads/d6443ac9-8d52-4d8b-a187-317f8e618eeb.webp?t=${Date.now()}`;
                                console.log("Tentative avec URL alternative:", fallbackUrl);
                                
                                const img = e.target as HTMLImageElement;
                            //     img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGREQ4RTUiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIGZpbGw9IiNFOTFFNjMiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                                
                                // Éviter les styles qui pourraient causer des problèmes
                                img.style.objectFit = 'contain';
                                img.style.backgroundColor = '#FFF5F8';
                              }}
                            />
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleDeletePhoto(photo)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Aucune photo n'a encore été ajoutée
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Équipements</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from(new Set(amenitiesList.map(a => a.category))).map(category => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-medium text-lg">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {amenitiesList
                        .filter(amenity => amenity.category === category)
                        .map((amenity) => (
                          <button
                            key={amenity.id}
                            onClick={() => isEditing && toggleAmenity(amenity.id)}
                            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                              selectedAmenities.includes(amenity.id)
                                ? 'bg-pink-50 border-pink-200'
                                : 'bg-white border-gray-200'
                            } ${!isEditing && 'cursor-default'}`}
                            disabled={!isEditing}
                          >
                            {amenity.icon}
                            <span className="text-sm">{amenity.label}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
