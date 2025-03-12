import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Minus, Plus } from "lucide-react";

interface GuestSelectorProps {
  adults: number;
  onAdultsChange: (newValue: number) => void;
  children: number;
  onChildrenChange: (newValue: number) => void;
  babies: number;
  onBabiesChange: (newValue: number) => void;
  pets: number;
  onPetsChange: (newValue: number) => void;
}

export default function GuestSelector({
  adults,
  onAdultsChange,
  children,
  onChildrenChange,
  babies,
  onBabiesChange,
  pets,
  onPetsChange,
}: GuestSelectorProps) {
  // État local pour contrôler l'ouverture du pop-up
  const [isOpen, setIsOpen] = useState(false);

  // Calcul du nombre total de voyageurs (hors bébés et animaux)
  const totalVoyageurs = adults + children;

  // On prépare des morceaux de texte (ex: "2 voyageurs", "1 bébé", "1 animale")
  const summaryParts: string[] = [];

  // Affichage « X voyageur(s) »
  if (totalVoyageurs > 0) {
    summaryParts.push(
      `${totalVoyageurs} voyageur${totalVoyageurs > 1 ? "s" : ""}`
    );
  }

  // Affichage « X bébé(s) »
  if (babies > 0) {
    summaryParts.push(`${babies} bébé${babies > 1 ? "s" : ""}`);
  }

  // Affichage « X animal(aux) »
  if (pets > 0) {
    summaryParts.push(`${pets} animal${pets > 1 ? "aux" : ""}`);
  }

  // Si on n'a aucune sélection, on affiche un texte par défaut
  const buttonLabel = summaryParts.length
    ? summaryParts.join(", ")
    : "Voyageurs - Ajoutez des voyageurs";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Bouton principal : récapitulatif (ex: "2 voyageurs, 1 bébé") */}
      <PopoverTrigger asChild>
        <button
          className="px-4 py-2 border rounded-full hover:shadow-sm transition"
        >
          {buttonLabel}
        </button>
      </PopoverTrigger>

      {/* Contenu du pop-up : compteurs pour adultes, enfants, bébés, animaux */}
      <PopoverContent
        className="z-50 p-4 shadow-lg rounded-xl border bg-white w-72"
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col space-y-4">
          {/* Adultes */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-semibold">Adultes</span>
              <span className="text-gray-500 text-sm">13 ans et plus</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onAdultsChange(Math.max(adults - 1, 0))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center">{adults}</span>
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onAdultsChange(adults + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Enfants */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-semibold">Enfants</span>
              <span className="text-gray-500 text-sm">2 à 12 ans</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onChildrenChange(Math.max(children - 1, 0))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center">{children}</span>
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onChildrenChange(children + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Bébés */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-semibold">Bébés</span>
              <span className="text-gray-500 text-sm">Moins de 2 ans</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onBabiesChange(Math.max(babies - 1, 0))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center">{babies}</span>
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onBabiesChange(babies + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Animaux */}
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-semibold">Animaux domestiques</span>
              <span className="text-gray-500 text-sm">Assistance, etc.</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onPetsChange(Math.max(pets - 1, 0))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center">{pets}</span>
              <button
                className="h-8 w-8 border rounded-full flex items-center justify-center hover:shadow-sm"
                onClick={() => onPetsChange(pets + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <hr className="my-2" />

          {/* Boutons en bas du pop-up */}
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
              onClick={() => setIsOpen(false)}
            >
              Appliquer
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
