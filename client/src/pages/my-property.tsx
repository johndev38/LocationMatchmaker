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
  Dumbbell, Baby, Dog, Coffee, Cigarette, ShowerHead
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Property = {
  id: number;
  title: string;
  description: string;
  address: string;
  photos: string[];
  amenities: string[];
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
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PreviewPhoto[]>([]);

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

  const { data: property, isLoading } = useQuery<Property, Error>({
    queryKey: ["property"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/property");
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des informations du bien");
      return response.json();
    },
    enabled: user?.isLandlord,
  });

  // Mettre à jour les champs lorsque les données sont chargées
  useEffect(() => {
    if (property) {
      setTitle(property.title);
      setDescription(property.description);
      setAddress(property.address);
      setSelectedAmenities(property.amenities || []);
    }
  }, [property]);

  // Nettoyer les prévisualisations à la destruction du composant
  useEffect(() => {
    return () => {
      // Libérer les URLs des prévisualisations
      pendingPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
    };
  }, [pendingPhotos]);

  const updatePropertyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("PUT", "/api/property", formData);
      if (!response.ok)
        throw new Error("Erreur lors de la mise à jour du bien");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Les informations de votre bien ont été mises à jour",
      });
      setIsEditing(false);
      // Vider les photos en attente après sauvegarde réussie
      setPendingPhotos([]);
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
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Limiter le nombre total de photos en attente à 5
    if (pendingPhotos.length + files.length > 5) {
      toast({
        title: "Attention",
        description: "Vous ne pouvez pas sélectionner plus de 5 photos au total",
        variant: "destructive",
      });
      return;
    }

    // Créer des prévisualisations pour chaque fichier
    const newPendingPhotos: PreviewPhoto[] = [];
    
    Array.from(files).forEach((file) => {
      // Vérifier la taille du fichier (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Attention",
          description: "Les images ne doivent pas dépasser 2MB chacune",
          variant: "destructive",
        });
        return;
      }

      // Créer une URL de prévisualisation
      const previewUrl = URL.createObjectURL(file);
      newPendingPhotos.push({
        file,
        preview: previewUrl
      });
    });

    // Ajouter les nouvelles photos aux photos en attente
    setPendingPhotos(prev => [...prev, ...newPendingPhotos]);

    // Activer le mode édition automatiquement si on ajoute des photos
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploadingPhotos(true);
  
      // 1. D'abord, mettre à jour les informations du bien (sans les photos)
      const basicFormData = new FormData();
      basicFormData.append("title", title);
      basicFormData.append("description", description);
      basicFormData.append("address", address);
      basicFormData.append("amenities", JSON.stringify(selectedAmenities));
  
      // Mise à jour des informations de base
      const basicInfoResponse = await apiRequest("PUT", "/api/property", basicFormData);
      
      if (!basicInfoResponse.ok) {
        const errorText = await basicInfoResponse.text();
        console.error("Erreur response:", errorText);
        throw new Error(`Erreur lors de la mise à jour des informations: ${errorText.slice(0, 100)}...`);
      }
      
      // 2. Si les photos sont disponibles, traitement avec une méthode simplifiée
      if (pendingPhotos.length > 0) {
        try {
          const propertyData = await basicInfoResponse.json();
          
          // Mise à jour direct sans FormData complexe
          for (let i = 0; i < pendingPhotos.length; i++) {
            const photoData = new FormData();
            photoData.append("propertyId", propertyData.id.toString());
            photoData.append("photo", pendingPhotos[i].file);
            
            const photoResponse = await fetch("/api/property/upload-photo", {
              method: "POST",
              body: photoData,
              headers: {
                // Pas d'en-tête Content-Type pour FormData
              },
              credentials: "include"
            });
            
            if (!photoResponse.ok) {
              console.error(`Erreur lors de l'upload de la photo ${i+1}:`, await photoResponse.text());
            }
          }
        } catch (photoErr) {
          console.error("Erreur pendant l'upload des photos:", photoErr);
          toast({
            title: "Attention",
            description: "Les informations ont été mises à jour mais l'upload des photos a échoué",
            variant: "destructive",
          });
        }
      }
      
      // 3. Succès final
      toast({
        title: "Succès",
        description: "Les informations de votre bien ont été mises à jour",
      });
      
      setIsEditing(false);
      setPendingPhotos([]); // Vider les photos en attente
      window.location.reload(); // Recharger pour afficher les changements
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
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

                <div>
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Adresse complète"
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
                        <div className="aspect-video relative overflow-hidden rounded-lg border-2 border-pink-300">
                          <img
                            src={photo.preview}
                            alt={`Photo en attente ${index + 1}`}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div className="absolute top-2 right-2">
                          <button
                            onClick={() => removePendingPhoto(index)}
                            className="p-1 bg-red-500 text-white rounded-full"
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Ces photos seront ajoutées lorsque vous enregistrerez les modifications
                  </p>
                </div>
              )}

              <h3 className="text-sm font-medium mb-3">Photos existantes :</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {property?.photos?.map((photo: string, index: number) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video relative overflow-hidden rounded-lg">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => deletePhotoMutation.mutate(photo)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {(!property?.photos || property.photos.length === 0) && pendingPhotos.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Aucune photo n'a été ajoutée
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
