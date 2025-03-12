import React, { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from "@radix-ui/react-popover";
import { DateRange, RangeKeyDict } from "react-date-range";
import { addDays, format } from "date-fns";
import "react-date-range/dist/styles.css"; // CSS principal
import "react-date-range/dist/theme/default.css"; // Thème par défaut

interface DateSelectorProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

/**
 * Composant "DateSelector" qui affiche un bouton "Dates"
 * et un pop-up pour sélectionner une plage de dates.
 * - startDate et endDate : valeurs actuelles
 * - onChange : callback pour remonter la sélection
 */
export default function DateSelector({
  startDate,
  endDate,
  onChange,
}: DateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // État local pour le calendrier (avant validation)
  const [range, setRange] = useState({
    startDate: startDate,
    endDate: endDate,
    key: "selection",
  });

  // Label du bouton : si aucune date, on affiche "Quand ?"
  // Sinon on formatte : "12 mar. - 18 mar." par exemple
  let buttonLabel = "Quand ?";
  if (range.startDate && range.endDate) {
    const sd = format(range.startDate, "d MMM");
    const ed = format(range.endDate, "d MMM");
    buttonLabel = `${sd} - ${ed}`;
  }

  // Gérer le changement de date dans le calendrier
  const handleSelect = (ranges: RangeKeyDict) => {
    const { startDate, endDate } = ranges.selection;
    setRange((prev) => ({
      ...prev,
      startDate: startDate || prev.startDate,
      endDate: endDate || prev.endDate,
    }));
  };

  // Appliquer la sélection (onChange) et fermer le pop-up
  const handleApply = () => {
    onChange(range.startDate, range.endDate);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="px-4 py-2 border rounded-full hover:shadow-sm transition">
          {buttonLabel}
        </button>
      </PopoverTrigger>

      <PopoverPortal>
        <PopoverContent
          className="z-50 p-4 shadow-lg rounded-xl border bg-white"
          sideOffset={8}
          align="start"
        >
          {/* Calendrier react-date-range */}
          <DateRange
            ranges={[range]}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            rangeColors={["#FF385C"]} // Couleur d'accent
            minDate={new Date()} // Optionnel : pas de sélection avant la date du jour
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
              onClick={handleApply}
            >
              Appliquer
            </button>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
