import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

export default function GuestSelector() {
  const [guests, setGuests] = useState({
    adults: 0,
    children: 0,
    babies: 0,
    pets: 0,
  });

  const updateCount = (type: keyof typeof guests, value: number) => {
    setGuests((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + value),
    }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {`Adultes: ${guests.adults}, Enfants: ${guests.children}, Bébés: ${guests.babies}, Animaux: ${guests.pets}`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="bg-white shadow-lg rounded-lg p-4 w-72">
        {[
          { label: "Adultes", description: "13 ans et plus", key: "adults" },
          { label: "Enfants", description: "2 à 12 ans", key: "children" },
          { label: "Bébés", description: "Moins de 2 ans", key: "babies" },
          { label: "Animaux domestiques", description: "", key: "pets" },
        ].map(({ label, description, key }) => (
          <div key={key} className="flex justify-between items-center py-2">
            <div>
              <p className="text-sm font-medium">{label}</p>
              {description && <p className="text-xs text-gray-500">{description}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateCount(key as keyof typeof guests, -1)}
                disabled={guests[key as keyof typeof guests] === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center">{guests[key as keyof typeof guests]}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => updateCount(key as keyof typeof guests, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
