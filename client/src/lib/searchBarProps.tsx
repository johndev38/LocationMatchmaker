import React from "react";
import { Search } from "lucide-react";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

import SingleDateSelector from "@/lib/SingleDateSelector";
import GuestSelector from "@/lib/GuestSelector";

interface SearchBarProps {
  // Valeurs et callbacks pour la destination
  destination: string;
  onDestinationChange: (value: string) => void;

  // Valeurs pour les dates
  startDate: Date | null;
  endDate: Date | null;
  // Callback quand on modifie la date d'arrivée ou de départ
  onDatesChange: (start: Date | null, end: Date | null) => void;

  // Valeurs pour les voyageurs
  adults: number;
  onAdultsChange: (val: number) => void;
  children: number;
  onChildrenChange: (val: number) => void;
  babies: number;
  onBabiesChange: (val: number) => void;
  pets: number;
  onPetsChange: (val: number) => void;

  // Bouton de recherche
  onSearch: () => void;
}

export default function SearchBar({
  destination,
  onDestinationChange,
  startDate,
  endDate,
  onDatesChange,
  adults,
  onAdultsChange,
  children,
  onChildrenChange,
  babies,
  onBabiesChange,
  pets,
  onPetsChange,
  onSearch,
}: SearchBarProps) {
  // Chargement de l'API Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik", // Remplacez par votre clé API
    libraries: ["places"],
  });

  // On appelle ce hook toujours, quel que soit isLoaded
  const [autocomplete, setAutocomplete] =
    React.useState<google.maps.places.Autocomplete | null>(null);

  const handleAutocompleteLoad = (instance: google.maps.places.Autocomplete) => {
    setAutocomplete(instance);
  };

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place?.geometry) {
        onDestinationChange(place.formatted_address || "");
      }
    }
  };

  return (
    <div
      className="
        flex items-center justify-between
        bg-white rounded-full shadow-md
        px-4 py-2 gap-4
      "
    >
      {/* Si l'API n'est pas chargée, on affiche un loader dans le champ destination */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-xs text-gray-500 font-semibold">
          Destination
        </span>
        {isLoaded ? (
          <Autocomplete
            onLoad={handleAutocompleteLoad}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Rechercher une destination"
              value={destination}
              onChange={(e) => onDestinationChange(e.target.value)}
              className="
                text-sm text-gray-800
                focus:outline-none
                placeholder-gray-400
                w-40
              "
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            placeholder="Chargement..."
            disabled
            className="
              text-sm text-gray-400
              focus:outline-none
              w-40
              border
              rounded-md
              px-2 py-1
            "
          />
        )}
      </div>

      {/* Arrivée : SingleDateSelector pour la date d'arrivée */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-xs text-gray-500 font-semibold">
          Arrivée
        </span>
        <SingleDateSelector
          date={startDate}
          onChange={(newDate) => onDatesChange(newDate, endDate)}
        />
      </div>

      {/* Départ : SingleDateSelector pour la date de départ */}
      <div className="flex flex-col gap-1 border-r pr-4">
        <span className="text-xs text-gray-500 font-semibold">
          Départ
        </span>
        <SingleDateSelector
          date={endDate}
          onChange={(newDate) => onDatesChange(startDate, newDate)}
        />
      </div>

      {/* Voyageurs */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-gray-500 font-semibold">
          Voyageurs
        </span>
        <GuestSelector
          adults={adults}
          onAdultsChange={onAdultsChange}
          children={children}
          onChildrenChange={onChildrenChange}
          babies={babies}
          onBabiesChange={onBabiesChange}
          pets={pets}
          onPetsChange={onPetsChange}
        />
      </div>

      {/* Bouton Recherche */}
      <button
        className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600"
        onClick={onSearch}
      >
        <Search className="h-4 w-4" />
      </button>
    </div>
  );
}
