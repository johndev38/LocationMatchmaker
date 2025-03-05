import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRentalRequestSchema, locationTypes } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Home, Mountain, Waves, Building2, Trees, Warehouse, Leaf, Droplets } from "lucide-react";
import { useState } from "react";

// Mapping des types de destination avec leurs icônes
const locationTypeIcons = {
  ville: <Building2 className="h-6 w-6" />,
  montagne: <Mountain className="h-6 w-6" />,
  mer: <Waves className="h-6 w-6" />,
  campagne: <Trees className="h-6 w-6" />,
  ferme: <Warehouse className="h-6 w-6" />,
  forêt: <Leaf className="h-6 w-6" />,
  lac: <Droplets className="h-6 w-6" />,
};

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-2xl font-bold">RentalMatch</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">Tableau de bord</Button>
            </Link>
            <Link href="/create-request">
              <Button variant="primary">Créer une Demande</Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Déconnexion"
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!user?.isLandlord && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Créer une demande de location</h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  createRequestMutation.mutate({ ...data, locationType: selectedTypes })
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="departureCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville de départ</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez votre ville de départ" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez votre destination souhaitée" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
                              form.setValue("locationType", newTypes);
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

                <FormField
                  control={form.control}
                  name="maxDistance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance maximale (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="peopleCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de personnes</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
        )}
      </main>
    </div>
  );
}