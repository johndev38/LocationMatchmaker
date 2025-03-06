import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalRequestSchema, locationTypes } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Building2, Mountain, Waves, Trees, Warehouse, Leaf, Droplets } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Library } from '@googlemaps/js-api-loader';
import { useJsApiLoader, GoogleMap, Marker, Circle, Autocomplete } from "@react-google-maps/api";
import { Slider } from "@/components/ui/slider";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import GuestSelector from "@/lib/GuestSelector";
const locationTypeIcons = {
  ville: <Building2 className="h-6 w-6" />,
  montagne: <Mountain className="h-6 w-6" />,
  mer: <Waves className="h-6 w-6" />,
  campagne: <Trees className="h-6 w-6" />,
  ferme: <Warehouse className="h-6 w-6" />,
  forêt: <Leaf className="h-6 w-6" />,
  lac: <Droplets className="h-6 w-6" />,
};

const mapContainerStyle = {
  height: '400px',
  width: '400px',
};
const libraries: Library[] = ['places'];
export default function CreateRentalRequest() {
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState({ lat: 48.8566, lng: 2.3522 });
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [circleRadius, setCircleRadius] = useState(100 * 1000); // Par défaut 100 km
  const mapRef = useRef<google.maps.Map | null>(null); // Référence pour la carte
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    //googleMapsApiKey: "AIzaSyB7ozOJkSl78CMvhM47gs4ASaUsaFG3hB8", clé restreinte
    libraries
  });

 

  const form = useForm({
    resolver: zodResolver(insertRentalRequestSchema),
    defaultValues: {
      departureCity: "",
      location: "",
      locationType: [],
      maxDistance: 100,
      peopleCount: 1,
      maxBudget: 1000,
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/rental-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-requests"] });
      toast({
        title: "Succès",
        description: "Votre demande de location a été créée.",
      });
      form.reset();
      setSelectedTypes([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });


 // Mettre à jour le rayon du cercle quand la distance change

  // 🔹 Met à jour le rayon du cercle en fonction de l'entrée utilisateur
  useEffect(() => {
    const distance = form.getValues("maxDistance") * 1000;
    setCircleRadius(distance);

    if (mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(coordinates.lat, coordinates.lng)); // Point central
      bounds.extend(new google.maps.LatLng(coordinates.lat + distance / 111320, coordinates.lng)); // Point éloigné

      mapRef.current.fitBounds(bounds); // Ajuste le zoom automatiquement
    }
  }, [form.watch("maxDistance")]);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        setCoordinates({ lat: location?.lat() || 0, lng: location?.lng() || 0 });
        form.setValue("departureCity", place.formatted_address || "");
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de trouver l'adresse.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Créer une demande de location</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) =>
            createRequestMutation.mutate({ ...data, locationType: selectedTypes })
          )}
          className="space-y-4"
        >
          <FormItem>
            <div>
            <FormLabel>Période de location</FormLabel>
            </div>
            <DateRange
              ranges={[dateRange]}
              onChange={(ranges: any) => setDateRange(ranges.selection)}
              moveRangeOnFirstSelection={false}
              rangeColors={["#3b82f6"]}
              className="w-64"
            />
          </FormItem>
             <FormField control={form.control} name="departureCity" render={({ field }) => (
              
            <FormItem>
              <FormLabel>Ville de départ</FormLabel>
              <FormControl>
                {isLoaded && (
                  <Autocomplete onLoad={setAutocomplete} onPlaceChanged={handlePlaceChanged}>
                    <Input placeholder="Entrez votre ville de départ" {...field} />
                  </Autocomplete>
                )}
              </FormControl>
            </FormItem>
          )} />
      <FormField control={form.control} name="maxDistance" render={({ field }) => (
            <FormItem>
              <FormLabel>Distance maximale (km)</FormLabel>
              <FormControl>
                <Slider
                  min={10}
                  max={500}
                  step={10}
                  value={[field.value]}
                  onValueChange={(val) => form.setValue("maxDistance", val[0])}
                />
              </FormControl>
              <p>{field.value} km</p>
            </FormItem>
          )} />
          
{isLoaded && (
            <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={coordinates}
            zoom={10}
            onLoad={(map) => {
              mapRef.current = map;
            }}
          >
            <Marker position={coordinates} />
            <Circle
              center={coordinates}
              radius={circleRadius}
              options={{
                strokeColor: "#0080ff",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#0080ff",
                fillOpacity: 0.35,
              }}
            />
          </GoogleMap>
      )}

          <FormField
            control={form.control}
            name="locationType"
            render={() => (
              <FormItem>
                <FormLabel>Types de destination</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {locationTypes.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={selectedTypes.includes(type) ? "default" : "outline"}
                      className="h-24 flex flex-col gap-2"
                      onClick={() => {
                        const newTypes = selectedTypes.includes(type)
                          ? selectedTypes.filter((t) => t !== type)
                          : [...selectedTypes, type];
                        setSelectedTypes(newTypes);
                        form.setValue("locationType", newTypes as never);
                      }}
                    >
                      {locationTypeIcons[type as keyof typeof locationTypeIcons]}
                      <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </Button>
                  ))}
                </div>
                {form.formState.errors.locationType && (
                  <p className="text-sm text-destructive mt-2">
                    Sélectionnez au moins un type de destination
                  </p>
                )}
              </FormItem>
            )}
          />
          <GuestSelector />


          <FormField
            control={form.control}
            name="maxBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget maximum (€)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

        

          <Button
            type="submit"
            className="w-full"
            disabled={createRequestMutation.isPending}
          >
            {createRequestMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Soumettre la demande
          </Button>
        </form>
      </Form>
      </div>
  );
}