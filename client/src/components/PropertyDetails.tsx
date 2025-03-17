import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wifi, Tv, Car, Home, UtensilsCrossed, Trees, Waves, Droplets,
  WashingMachine, Bath, Bed, DoorOpen, Fan, Footprints, Gamepad2, Key, Laptop,
  Microwave, Mountain, ParkingCircle, Shirt, Snowflake, Sofa, Sun, Thermometer,
  Dumbbell, Baby, Dog, Coffee, Cigarette, ShowerHead
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Liste des équipements disponibles et leurs icônes
const amenitiesIcons = {
  // Vue et Localisation
  vue_baie: { label: "Vue sur la baie", icon: <Home className="h-5 w-5" />, category: "Vue et Localisation" },
  vue_jardin: { label: "Vue sur le jardin", icon: <Trees className="h-5 w-5" />, category: "Vue et Localisation" },
  vue_montagne: { label: "Vue montagne", icon: <Mountain className="h-5 w-5" />, category: "Vue et Localisation" },
  acces_plage: { label: "Accès plage ou bord de mer", icon: <Waves className="h-5 w-5" />, category: "Vue et Localisation" },
  centre_ville: { label: "Proximité centre-ville", icon: <Home className="h-5 w-5" />, category: "Vue et Localisation" },

  // Équipements essentiels
  wifi: { label: "Wifi", icon: <Wifi className="h-5 w-5" />, category: "Essentiels" },
  cuisine: { label: "Cuisine équipée", icon: <UtensilsCrossed className="h-5 w-5" />, category: "Essentiels" },
  cuisine_partagee: { label: "Cuisine partagée", icon: <UtensilsCrossed className="h-5 w-5" />, category: "Essentiels" },
  salle_bain_privee: { label: "Salle de bain privée", icon: <Bath className="h-5 w-5" />, category: "Essentiels" },
  salle_bain_partagee: { label: "Salle de bain partagée", icon: <Bath className="h-5 w-5" />, category: "Essentiels" },
  chambre_privee: { label: "Chambre privée", icon: <Bed className="h-5 w-5" />, category: "Essentiels" },
  entree_privee: { label: "Entrée privée", icon: <DoorOpen className="h-5 w-5" />, category: "Essentiels" },

  // Stationnement
  parking: { label: "Parking gratuit sur place", icon: <Car className="h-5 w-5" />, category: "Stationnement" },
  parking_rue: { label: "Parking gratuit dans la rue", icon: <ParkingCircle className="h-5 w-5" />, category: "Stationnement" },
  parking_payant: { label: "Parking payant", icon: <Car className="h-5 w-5" />, category: "Stationnement" },

  // Divertissement
  television: { label: "Télévision", icon: <Tv className="h-5 w-5" />, category: "Divertissement" },
  console_jeux: { label: "Console de jeux", icon: <Gamepad2 className="h-5 w-5" />, category: "Divertissement" },
  espace_travail: { label: "Espace de travail", icon: <Laptop className="h-5 w-5" />, category: "Divertissement" },

  // Équipements de confort
  climatisation: { label: "Climatisation", icon: <Snowflake className="h-5 w-5" />, category: "Confort" },
  chauffage: { label: "Chauffage", icon: <Thermometer className="h-5 w-5" />, category: "Confort" },
  ventilateur: { label: "Ventilateur", icon: <Fan className="h-5 w-5" />, category: "Confort" },

  // Installations
  piscine: { label: "Piscine extérieure commune", icon: <Droplets className="h-5 w-5" />, category: "Installations" },
  jacuzzi: { label: "Jacuzzi", icon: <Droplets className="h-5 w-5" />, category: "Installations" },
  salle_sport: { label: "Salle de sport", icon: <Dumbbell className="h-5 w-5" />, category: "Installations" },
  terrasse: { label: "Terrasse", icon: <Sun className="h-5 w-5" />, category: "Installations" },
  balcon: { label: "Balcon", icon: <Sun className="h-5 w-5" />, category: "Installations" },
  jardin: { label: "Jardin", icon: <Trees className="h-5 w-5" />, category: "Installations" },

  // Services
  lave_linge: { label: "Lave-linge (Payant)", icon: <WashingMachine className="h-5 w-5" />, category: "Services" },
  seche_linge: { label: "Sèche-linge (Payant)", icon: <WashingMachine className="h-5 w-5" />, category: "Services" },
  fer_repasser: { label: "Fer à repasser", icon: <Shirt className="h-5 w-5" />, category: "Services" },
  micro_ondes: { label: "Four micro-ondes", icon: <Microwave className="h-5 w-5" />, category: "Services" },
  cafetiere: { label: "Cafetière", icon: <Coffee className="h-5 w-5" />, category: "Services" },

  // Caractéristiques
  adapte_bebe: { label: "Adapté aux bébés", icon: <Baby className="h-5 w-5" />, category: "Caractéristiques" },
  animaux_acceptes: { label: "Animaux acceptés", icon: <Dog className="h-5 w-5" />, category: "Caractéristiques" },
  fumeur_autorise: { label: "Fumeur autorisé", icon: <Cigarette className="h-5 w-5" />, category: "Caractéristiques" },
  acces_handicape: { label: "Accès handicapé", icon: <Footprints className="h-5 w-5" />, category: "Caractéristiques" },

  // Mobilier
  canape_lit: { label: "Canapé-lit", icon: <Sofa className="h-5 w-5" />, category: "Mobilier" },
  lit_double: { label: "Lit double", icon: <Bed className="h-5 w-5" />, category: "Mobilier" },
  lit_simple: { label: "Lit simple", icon: <Bed className="h-5 w-5" />, category: "Mobilier" },
};

type PropertyDetailsProps = {
  property: {
    id: number;
    title: string;
    description: string;
    address: string;
    photos: string[];
    amenities: string[];
  };
};

export default function PropertyDetails({ property }: PropertyDetailsProps) {
  // Regrouper les équipements par catégorie
  const amenitiesByCategory: Record<string, { id: string; label: string; icon: React.ReactNode }[]> = {};
  
  property.amenities?.forEach(amenityId => {
    const amenity = amenitiesIcons[amenityId as keyof typeof amenitiesIcons];
    if (amenity) {
      if (!amenitiesByCategory[amenity.category]) {
        amenitiesByCategory[amenity.category] = [];
      }
      amenitiesByCategory[amenity.category].push({
        id: amenityId,
        label: amenity.label,
        icon: amenity.icon
      });
    }
  });

  // Formater correctement les URLs des photos
  const formattedPhotos = property.photos?.map(photo => {
    const serverBaseUrl = 'http://localhost:5000';
    return photo.startsWith('http') 
      ? photo 
      : photo.startsWith('/') 
        ? `${serverBaseUrl}${photo}` 
        : `${serverBaseUrl}/${photo}`;
  }) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{property.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Adresse</h3>
              <p className="text-gray-600">{property.address}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Description</h3>
              <p className="text-gray-600">{property.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {formattedPhotos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel className="w-full">
              <CarouselContent>
                {formattedPhotos.map((photoUrl, index) => (
                  <CarouselItem key={index}>
                    <div className="h-64 w-full relative rounded-lg overflow-hidden">
                      <img 
                        src={photoUrl} 
                        alt={`Photo ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${photoUrl}`);
                          const img = e.target as HTMLImageElement;
                          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGREQ4RTUiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTUiIGZpbGw9IiNFOTFFNjMiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                          img.style.objectFit = 'contain';
                          img.style.backgroundColor = '#FFF5F8';
                        }}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>
      )}

      {Object.keys(amenitiesByCategory).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Équipements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(amenitiesByCategory).map(([category, amenities]) => (
                <div key={category} className="space-y-3">
                  <h3 className="font-medium text-lg">{category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {amenities.map((amenity) => (
                      <div
                        key={amenity.id}
                        className="flex items-center gap-3 p-4 rounded-lg border bg-pink-50 border-pink-200"
                      >
                        {amenity.icon}
                        <span className="text-sm">{amenity.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 