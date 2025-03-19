import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertRentalRequestSchema,
  locationTypes,
  amenities,
} from "@shared/schema";
import type { RentalRequest } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2,
  Building2,
  Mountain,
  Waves,
  Trees,
  Warehouse,
  Leaf,
  Droplets,
  MapPin,
  Euro,
  Info,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
} from "@react-google-maps/api";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import GuestSelector from "@/lib/GuestSelector";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import Header from "./header";

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
  borderRadius: "12px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
};

// Catégories d'aménités pour une meilleure organisation
const amenityCategories = {
  "Confort essentiel": [
    "wifi",
    "climatisation",
    "lave_linge",
    "lave_vaisselle",
    "television",
    "ascenseur",
  ],
  "Extérieur": [
    "piscine",
    "jardin",
    "terrasse",
    "barbecue",
    "parking",
  ],
  "Luxe et bien-être": [
    "jacuzzi",
    "sauna",
    "salle_sport",
  ],
  "Vues et environnement": [
    "vue_mer",
    "vue_montagne",
    "calme",
  ],
  "Accessibilité": [
    "accessible_handicap",
    "animaux_acceptes",
  ],
  "Proximité": [
    "proche_commerces",
    "proche_transports",
    "proche_plage",
    "proche_ski",
  ],
};

export default function CreateRentalRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [coordinates, setCoordinates] = useState({
    lat: 46.603354, // Centre de la France
    lng: 1.888334,
  });
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: undefined,
  });
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [circleRadius, setCircleRadius] = useState(100 * 1000); // 100 km par défaut
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeTab, setActiveTab] = useState("informations");
  
  // Configuration de l'API Google Maps
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyAwAe2WoKH9Th_sqMG3ffpienZDHSk3Zik",
    libraries: ["places"],
  });

  // Configuration du formulaire avec React Hook Form et validation par Zod
  const form = useForm<RentalRequest>({
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
      amenities: [],
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 1 semaine par défaut
    },
  });

  // Pour suivre les valeurs des invités
  const { adults, children, babies, pets } = form.watch();

  // Mutation React Query pour soumettre la demande
  const createRequestMutation = useMutation({
    mutationFn: async (data: RentalRequest) => {
      const res = await apiRequest("POST", "/api/rental-requests", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande créée",
        description: "Votre demande de location a été enregistrée avec succès.",
      });
      navigate("/my-listings");
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mise à jour du rayon du cercle quand la distance change
  useEffect(() => {
    const distance = form.getValues("maxDistance") * 1000;
    setCircleRadius(distance);

    if (mapRef.current && isLoaded) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(coordinates.lat, coordinates.lng));
      bounds.extend(
        new google.maps.LatLng(
          coordinates.lat + distance / 111320,
          coordinates.lng
        )
      );

      mapRef.current.fitBounds(bounds);
    }
  }, [form.watch("maxDistance"), isLoaded]);

  // Mise à jour des dates dans le formulaire quand le range date change
  useEffect(() => {
    if (dateRange.from) {
      form.setValue("startDate", dateRange.from);
    }
    if (dateRange.to) {
      form.setValue("endDate", dateRange.to);
    }
  }, [dateRange, form]);

  // Gestion de la sélection d'adresse via Google Places
  const handlePlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        const location = place.geometry.location;
        setCoordinates({
          lat: location?.lat() || 0,
          lng: location?.lng() || 0,
        });
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

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    const hasRequiredFields = 
      form.getValues("departureCity") && 
      selectedTypes.length > 0 && 
      form.getValues("maxBudget") && 
      form.getValues("startDate") && 
      form.getValues("endDate");
    
    return hasRequiredFields;
  };

  // Obtenir la liste des champs manquants
  const getMissingFields = () => {
    const missingFields = [];
    if (!form.getValues("departureCity")) missingFields.push("Ville de départ");
    if (selectedTypes.length === 0) missingFields.push("Types de destination");
    if (!form.getValues("maxBudget")) missingFields.push("Budget maximum");
    if (!dateRange.from || !dateRange.to) missingFields.push("Dates de séjour");
    return missingFields;
  };

  // Soumission du formulaire
  const handleSubmitForm = (data: RentalRequest) => {
    if (!isFormValid()) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    // Mise à jour des types de location
    data.locationType = selectedTypes;
    createRequestMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Header />
      <div className="container max-w-4xl mx-auto px-4 py-8 pt-24">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Créer votre demande de location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="informations" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="informations">Informations</TabsTrigger>
                <TabsTrigger value="preferences">Préférences</TabsTrigger>
                <TabsTrigger value="amenites">Aménités</TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmitForm)}>
                  <TabsContent value="informations" className="space-y-6">
                    {/* Ville de départ */}
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="departureCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-md font-semibold flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
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
                                    className="h-12"
                                  />
                                </Autocomplete>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Carte Google Maps */}
                      {isLoaded && (
                        <div className="mt-4">
                          <GoogleMap
                            mapContainerStyle={mapContainerStyle}
                            center={coordinates}
                            zoom={6}
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
                                fillColor: "#FF385C",
                                fillOpacity: 0.15,
                              }}
                            />
                          </GoogleMap>
                        </div>
                      )}

                      {/* Distance maximale */}
                      <FormField
                        control={form.control}
                        name="maxDistance"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel className="text-md font-semibold">
                              Distance maximale
                            </FormLabel>
                            <div className="flex items-center gap-2">
                              <FormControl>
                                <Slider
                                  min={10}
                                  max={500}
                                  step={10}
                                  value={[field.value]}
                                  onValueChange={(val) =>
                                    form.setValue("maxDistance", val[0])
                                  }
                                />
                              </FormControl>
                              <span className="min-w-[60px] text-center font-medium bg-gray-100 rounded-md px-2 py-1">
                                {field.value} km
                              </span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Période de location */}
                    <div className="space-y-2">
                      <p className="text-md font-semibold">Dates du séjour</p>
                      <div className="grid gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-12",
                                !dateRange && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "PPP", { locale: fr })} - {" "}
                                    {format(dateRange.to, "PPP", { locale: fr })}
                                  </>
                                ) : (
                                  format(dateRange.from, "PPP", { locale: fr })
                                )
                              ) : (
                                <span>Sélectionnez vos dates</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={(range) => {
                                setDateRange(range || { from: new Date(), to: undefined });
                                if (range?.from) form.setValue("startDate", range.from);
                                if (range?.to) form.setValue("endDate", range.to);
                              }}
                              numberOfMonths={2}
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Nombre de voyageurs */}
                    <div className="space-y-2">
                      <p className="text-md font-semibold">Voyageurs</p>
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
                    </div>

                    {/* Budget maximum */}
                    <FormField
                      control={form.control}
                      name="maxBudget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-md font-semibold flex items-center gap-2">
                            <Euro className="h-4 w-4" />
                            Budget maximum
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                placeholder="Entrez votre budget maximum"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                className="h-12 pl-10"
                              />
                              <span className="absolute left-3 top-3 text-gray-500">€</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => navigate(-1)}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setActiveTab("preferences")}
                      >
                        Suivant
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="preferences" className="space-y-6">
                    {/* Types de destination */}
                    <div className="space-y-2">
                      <p className="text-md font-semibold">Types de destination</p>
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
                                form.setValue("locationType", newTypes);
                              }}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all h-[90px]",
                                isSelected 
                                  ? "border-pink-500 bg-pink-50 text-pink-700" 
                                  : "border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {locationTypeIcons[type as keyof typeof locationTypeIcons]}
                              <span className="text-sm font-medium mt-2 capitalize">
                                {type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {selectedTypes.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">
                          Veuillez sélectionner au moins un type de destination
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setActiveTab("informations")}
                      >
                        Précédent
                      </Button>
                      <Button 
                        type="button"
                        onClick={() => setActiveTab("amenites")}
                      >
                        Suivant
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="amenites" className="space-y-6">
                    {/* Aménités souhaitées */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-gray-500" />
                        <p className="text-sm text-gray-500 italic">
                          Ces préférences sont optionnelles et aideront les propriétaires à vous proposer des logements adaptés.
                        </p>
                      </div>
                      
                      <Accordion type="multiple" className="w-full">
                        {Object.entries(amenityCategories).map(([category, amenityList]) => (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger className="text-md font-semibold hover:no-underline">
                              {category}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {amenityList.map((amenity) => (
                                  <div key={amenity} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`amenity-${amenity}`}
                                      checked={form.watch("amenities")?.includes(amenity)}
                                      onCheckedChange={(checked) => {
                                        const currentAmenities = form.watch("amenities") || [];
                                        if (checked) {
                                          form.setValue("amenities", [...currentAmenities, amenity]);
                                        } else {
                                          form.setValue(
                                            "amenities",
                                            currentAmenities.filter((a: string) => a !== amenity)
                                          );
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`amenity-${amenity}`}
                                      className="capitalize cursor-pointer"
                                    >
                                      {amenity.replace(/_/g, " ")}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>

                    {/* Récapitulatif */}
                    <Card className="border border-gray-200 bg-gray-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Récapitulatif</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-medium">Ville de départ:</div>
                          <div>{form.getValues("departureCity") || "Non spécifié"}</div>
                          
                          <div className="font-medium">Dates:</div>
                          <div>
                            {dateRange.from && dateRange.to
                              ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                              : "Non spécifiées"}
                          </div>
                          
                          <div className="font-medium">Distance max:</div>
                          <div>{form.getValues("maxDistance")} km</div>
                          
                          <div className="font-medium">Voyageurs:</div>
                          <div>
                            {adults} adulte{adults > 1 ? "s" : ""}
                            {children > 0 && `, ${children} enfant${children > 1 ? "s" : ""}`}
                            {babies > 0 && `, ${babies} bébé${babies > 1 ? "s" : ""}`}
                            {pets > 0 && `, ${pets} animal${pets > 1 ? "aux" : ""}`}
                          </div>
                          
                          <div className="font-medium">Budget max:</div>
                          <div>{form.getValues("maxBudget")} €</div>
                          
                          <div className="font-medium">Types de lieu:</div>
                          <div>
                            {selectedTypes.length > 0
                              ? selectedTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
                              : "Non spécifiés"}
                          </div>
                        </div>
                        
                        {getMissingFields().length > 0 && (
                          <div className="mt-4 text-red-500">
                            <p className="font-medium">Champs manquants :</p>
                            <ul className="list-disc pl-5">
                              {getMissingFields().map((field, index) => (
                                <li key={index}>{field}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-between mt-6">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setActiveTab("preferences")}
                      >
                        Précédent
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createRequestMutation.isPending || !isFormValid()}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        {createRequestMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Traitement...
                          </>
                        ) : (
                          "Soumettre la demande"
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
