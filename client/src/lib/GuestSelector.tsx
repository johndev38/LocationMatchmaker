import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Minus, Plus } from "lucide-react";

/**
 * Props attendues par le composant GuestSelector :
 * - adults, children, babies, pets : nombres actuels
 * - onAdultsChange, onChildrenChange, etc. : callbacks
 *   qui remontent les nouvelles valeurs au parent
 */
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
  // État pour gérer l'ouverture du pop-up
  const [isOpen, setIsOpen] = useState(false);

  // Calcul du total de voyageurs (hors animaux)
  const totalGuests = adults + children + babies;

  // Label du bouton : si aucun voyageur, on met un texte par défaut
  // Sinon, on affiche le nombre de voyageurs et d'animaux
  const buttonLabel =
    totalGuests > 0
      ? `Voyageurs: ${totalGuests}${
          pets > 0 ? ` • ${pets} animal(aux)` : ""
        }`
      : "Voyageurs - Ajoutez des voyageurs";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Bouton déclencheur du pop-up */}
      <PopoverTrigger asChild>
        <button
          className="px-4 py-2 border rounded-full hover:shadow-sm transition"
        >
          {buttonLabel}
        </button>
      </PopoverTrigger>

      {/* Contenu du pop-up */}
      <PopoverContent
        className="p-4 shadow-lg rounded-xl border bg-white w-72"
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

          {/* Boutons de contrôle (en bas du pop-up) */}
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
