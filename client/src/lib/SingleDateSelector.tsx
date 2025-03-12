import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Calendar } from "react-date-range";
import { format } from "date-fns";

// CSS de react-date-range
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface SingleDateSelectorProps {
  /** La date actuellement sélectionnée (ou null si aucune) */
  date: Date | null;
  /** Callback déclenché quand l'utilisateur choisit une date */
  onChange: (date: Date | null) => void;
}

/**
 * Sélecteur de date unique :
 * - Affiche un bouton (vide si aucune date).
 * - Au clic, ouvre un calendrier.
 * - L'utilisateur sélectionne une date -> onChange(date).
 * - Boutons "Annuler" / "Appliquer" pour fermer le pop-up.
 */
export default function SingleDateSelector({
  date,
  onChange,
}: SingleDateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Label du bouton : vide si date === null, sinon on formatte la date
  const buttonLabel = date ? format(date, "d MMM yyyy") : "";

  // Gère la sélection dans le calendrier
  const handleSelect = (newDate: Date) => {
    onChange(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {/* Bouton qui affiche la date (ou rien) */}
      <PopoverTrigger asChild>
        <button
          className="
            text-sm text-gray-800
            focus:outline-none
            placeholder-gray-400
            w-28
            border rounded-md px-2 py-1
          "
        >
          {buttonLabel || ""}
        </button>
      </PopoverTrigger>

      {/* Contenu du pop-up : un calendrier simple */}
      <PopoverContent
        className="z-50 p-4 shadow-lg rounded-xl border bg-white w-auto"
        sideOffset={8}
      >
        <Calendar
          date={date || new Date()}   // si date=null, on affiche la date du jour
          onChange={(newDate) => handleSelect(newDate)}
          color="#FF385C"            // Couleur de sélection Airbnb
        />

        <div className="flex justify-end space-x-2 mt-2">
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
      </PopoverContent>
    </Popover>
  );
}
