import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertRentalRequestSchema,
  locationTypes,
} from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Loader2,
  Building2,
  Mountain,
  Waves,
  Trees,
  Warehouse,
  Leaf,
  Droplets,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Library } from "@googlemaps/js-api-loader";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
} from "@react-google-maps/api";
import { Slider } from "@/components/ui/slider";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useNavigate } from "react-router-dom";
import Header from "./header";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import GuestSelector from "@/lib/GuestSelector";
// import ProfileTab from "./ProfileTab";

/* 
  🔹 Couleurs, typographie et spacing inspirés d'Airbnb
  - Couleurs dominantes : tons "pastel" ou "soft" (ex: #FF385C pour l'accent),
    gris foncé (#484848), gris moyen (#717171), gris clair (#f7f7f7).
  - Typographie sobre, arrondie, avec du whitespace généreux.
  - Animations de hover/focus subtiles sur les boutons et cartes.
*/
const containerStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 2px 15px rgba(0, 0, 0, 0.05)",
  padding: "24px",
  fontFamily: "'Helvetica Neue', Arial, sans-serif", // Airbnb-like font style
};

const headingStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  marginBottom: "1rem",
  textAlign: "center",
  color: "#484848",
  fontWeight: 700,
};

const subheadingStyle: React.CSSProperties = {
  fontSize: "1rem",
  fontWeight: 600,
  color: "#484848",
  marginBottom: "0.5rem",
};

const fieldLabelStyle: React.CSSProperties = {
  marginBottom: "0.2rem",
  fontWeight: 600,
  color: "#484848",
};

const buttonPrimaryStyle: React.CSSProperties = {
  backgroundColor: "#FF385C", // Airbnb's pinkish-red
  borderColor: "#FF385C",
  color: "#ffffff",
  fontWeight: 600,
};

const buttonOutlineStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderColor: "#FF385C",
  color: "#FF385C",
  transition: "all 0.2s ease",
};

const buttonActiveStyle: React.CSSProperties = {
  transform: "scale(0.98)",
};

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
  height: "400px",
  width: "100%",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

// Libraries Google Maps
const libraries: Library[] = ["places"];

export default function CreateRentalRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState({
    lat: 48.8566,
    lng: 2.3522,
  });
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [circleRadius, setCircleRadius] = useState(100 * 1000); // Par défaut 100 km
  const mapRef = useRef<google.maps.Map | null>(null); // Référence pour la carte
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    libraries,
  });

  const form = useForm({
    resolver: zodResolver(insertRentalRequestSchema),
    defaultValues: {
      departureCity: "",
      locationType: [],
      maxDistance: 100,
      adults: 1,
      children: 0,
      babies: 0,
      pets: 0,
      maxBudget: 1000,
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  // Pour suivre les valeurs des invités et mettre à jour le récapitulatif
  const { adults, children, babies, pets } = form.watch();

  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("data", data);
      const res = await apiRequest("POST", "/api/rental-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rentalRequests"],
      });
      queryClient.invalidateQueries({
        queryKey: ["propertyOffers"],
      });
      toast({
        title: "Succès",
        description: "Votre demande de location a été créée.",
      });
      form.reset();
      setSelectedTypes([]);
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Erreur lors de la création de la demande:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Met à jour le rayon du cercle quand la distance change
  useEffect(() => {
    const distance = form.getValues("maxDistance") * 1000;
    setCircleRadius(distance);

    if (mapRef.current) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(
        new google.maps.LatLng(coordinates.lat, coordinates.lng)
      ); // Point central
      bounds.extend(
        new google.maps.LatLng(
          coordinates.lat + distance / 111320,
          coordinates.lng
        )
      ); // Point éloigné

      mapRef.current.fitBounds(bounds); // Ajuste le zoom automatiquement
    }
  }, [form.watch("maxDistance")]);

  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      console.log("Lieu sélectionné:", place);
      if (place.geometry) {
        const location = place.geometry.location;
        setCoordinates({
          lat: location?.lat() || 0,
          lng: location?.lng() || 0,
        });
        form.setValue("departureCity", place.formatted_address || "");
      } else {
        console.error("Erreur: Impossible de trouver l'adresse.");
        toast({
          title: "Erreur",
          description: "Impossible de trouver l'adresse.",
          variant: "destructive",
        });
      }
    }
  };

  // Calculer si le formulaire est valide
  const isFormValid = form.formState.isValid && selectedTypes.length > 0;

  const getMissingFields = () => {
    console.log("form.formState.isValid", form.formState.isValid);
    console.log("selectedTypes", selectedTypes);
    const errors = form.formState.errors;
    const missingFields = [];
    if (!form.getValues("departureCity")) missingFields.push("Ville de départ");
    if (!form.getValues("maxDistance"))
      missingFields.push("Distance maximale");
    if (!form.getValues("maxBudget")) missingFields.push("Budget maximum");
    if (selectedTypes.length === 0)
      missingFields.push("Types de destination");
    return missingFields;
  };

  useEffect(() => {
    const subscription = form.watch((values) => {
      console.log("Valeurs actuelles du formulaire:", values);
      console.log("Erreurs de validation:", form.formState.errors);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleSubmitForm = (data: any) => {
    if (!isFormValid) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      ...data,
      locationType: selectedTypes,
    });
  };

  const updateCount = (
    field: "adults" | "children" | "babies" | "pets",
    value: number
  ) => {
    const currentValue = Number(form.getValues(field)) || 0;
    form.setValue(field, Math.max(0, currentValue + value));
  };

  // État pour contrôler l'ouverture du Popover pour la sélection des invités
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  return (
    <div>
      <Header />
      {/* <ProfileTab /> */}
      <div style={containerStyle}>
        <div className="pt-20">
          <h2 style={headingStyle}>Créer une demande de location</h2>
          <Form {...form}>


          <GuestSelector
                adults={adults}
                onAdultsChange={(val: number) => form.setValue("adults", val)}
                children={children}
                onChildrenChange={(val: number) => form.setValue("children", val)}
                babies={babies}
                onBabiesChange={(val: number) => form.setValue("babies", val)}
                pets={pets}
                onPetsChange={(val) => form.setValue("pets", val)}
              />


            <form onSubmit={form.handleSubmit(handleSubmitForm)}>
              <FormItem>
                <div style={subheadingStyle}>Période de location</div>
                <DateRange
                  ranges={[dateRange]}
                  onChange={(ranges: any) => {
                    setDateRange(ranges.selection);
                    form.setValue("startDate", ranges.selection.startDate);
                    form.setValue("endDate", ranges.selection.endDate);
                  }}
                  moveRangeOnFirstSelection={false}
                  rangeColors={["#FF385C"]} // Couleur Airbnb
                  className="w-full rounded-md shadow-sm"
                />
              </FormItem>

              <FormField
                control={form.control}
                name="departureCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={fieldLabelStyle}>
                      Ville de départ
                    </FormLabel>
                    <FormControl>
                      {isLoaded && (
                        <Autocomplete
                          onLoad={setAutocomplete}
                          onPlaceChanged={handlePlaceChanged}
                        >
                          <Input
                            placeholder="Entrez votre ville de départ"
                            {...field}
                            className="border-gray-300 rounded-md focus:ring-2 focus:ring-pink-200 transition duration-150"
                          />
                        </Autocomplete>
                      )}
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={fieldLabelStyle}>
                      Distance maximale (km)
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={10}
                        max={500}
                        step={10}
                        value={[field.value]}
                        onValueChange={(val) =>
                          form.setValue("maxDistance", val[0])
                        }
                        className="mt-2"
                      />
                    </FormControl>
                    <p className="text-gray-600">{field.value} km</p>
                  </FormItem>
                )}
              />

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
                      strokeColor: "#FF385C",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      fillOpacity: 0.15, // plus léger pour être moins agressif
                    }}
                  />
                </GoogleMap>
              )}

              <FormField
                control={form.control}
                name="locationType"
                render={() => (
                  <FormItem>
                    <FormLabel style={fieldLabelStyle}>
                      Types de destination
                    </FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {locationTypes.map((type) => {
                        const isSelected = selectedTypes.includes(type);
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const newTypes = isSelected
                                ? selectedTypes.filter((t) => t !== type)
                                : [...selectedTypes, type];
                              setSelectedTypes(newTypes);
                              form.setValue(
                                "locationType",
                                newTypes as never
                              );
                            }}
                            style={{
                              ...(isSelected
                                ? buttonPrimaryStyle
                                : buttonOutlineStyle),
                              borderWidth: "2px",
                              borderStyle: "solid",
                              borderRadius: "12px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "12px",
                              height: "88px",
                              cursor: "pointer",
                            }}
                            onMouseDown={(e) => {
                              e.currentTarget.style.transform =
                                buttonActiveStyle.transform || "";
                            }}
                            onMouseUp={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            className="transition-transform duration-100 hover:shadow-md"
                          >
                            {locationTypeIcons[
                              type as keyof typeof locationTypeIcons
                            ]}
                            <span className="text-sm font-semibold mt-1">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />

 
              <FormField
                control={form.control}
                name="maxBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={fieldLabelStyle}>
                      Budget maximum (€)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                        className="border-gray-300 rounded-md focus:ring-2 focus:ring-pink-200 transition duration-150"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit" // Assurez-vous que le type est bien "submit"
                className="w-full py-3 mt-4 text-lg rounded-md font-semibold transition duration-150"
                style={buttonPrimaryStyle}
                disabled={!isFormValid || createRequestMutation.isPending}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform =
                    buttonActiveStyle.transform || "";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                {createRequestMutation.isPending && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                Soumettre la demande
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
