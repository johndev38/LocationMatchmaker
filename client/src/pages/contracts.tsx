import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import Header from "./header";
import { Loader2, Home, User, Calendar, Euro, CheckCircle, XCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Contract {
  id: number;
  offerId: number;
  tenantId: string;
  landlordId: string;
  propertyId: number;
  price: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  landlord: {
    id: string;
    name: string;
    email: string;
  };
  property: {
    id: number;
    title: string;
    address: string;
    photos?: string[];
  };
  offer: {
    id: number;
    price: number;
    description: string;
    availableAmenities?: string[];
  };
}

export default function ContractsPage() {
  const { user } = useAuth();

  // Récupérer tous les contrats de l'utilisateur
  const { data: contracts = [], isLoading, error } = useQuery({
    queryKey: ["userContracts"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contracts");
      if (!response.ok) throw new Error("Erreur lors de la récupération des contrats");
      return response.json();
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-20">
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            <p>Une erreur s'est produite lors de la récupération de vos contrats.</p>
            <p className="text-sm mt-2">Message d'erreur: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Header />

      <div className="container mx-auto px-4 py-8 pt-24 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Mes contrats</h1>
            <p className="text-gray-500 mt-1">
              Consultez vos contrats de location actifs et passés
            </p>
          </div>
        </div>

        {contracts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="bg-pink-50 inline-flex rounded-full p-4 mb-4">
                <Info className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun contrat</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                Vous n'avez pas encore de contrats. Lorsque vous acceptez une offre de location, un contrat est automatiquement créé.
              </p>
              <Button asChild className="bg-pink-600 hover:bg-pink-700">
                <a href="/myListings" className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> Voir mes recherches
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map((contract: Contract) => {
              const isLandlord = user?.id === contract.landlordId;
              const otherParty = isLandlord ? contract.tenant : contract.landlord;
              
              return (
                <Card key={contract.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-800">
                          {contract.property.title || "Propriété"}
                        </CardTitle>
                        <p className="text-gray-600 text-sm mt-1">{contract.property.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-pink-600">{contract.price} €</p>
                        <Badge className={
                          contract.status === "active" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-600"
                        }>
                          {contract.status === "active" ? "Actif" : "Terminé"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Informations sur le contrat</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Période</p>
                              <p className="text-sm text-gray-600">
                                {new Date(contract.startDate).toLocaleDateString('fr-FR')} - {new Date(contract.endDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Prix convenu</p>
                              <p className="text-sm text-gray-600">{contract.price} €</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Propriété</p>
                              <p className="text-sm text-gray-600">{contract.property.title || "Propriété"}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 mb-2">Informations sur {isLandlord ? "le locataire" : "le propriétaire"}</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Nom</p>
                              <p className="text-sm text-gray-600">{otherParty.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-gray-600">{otherParty.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <div>
                              <p className="text-sm font-medium">Rôle</p>
                              <p className="text-sm text-gray-600">{isLandlord ? "Locataire" : "Propriétaire"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {contract.offer.availableAmenities && contract.offer.availableAmenities.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm text-gray-500 mb-2">Prestations incluses</p>
                        <div className="flex flex-wrap gap-2">
                          {contract.offer.availableAmenities.map((amenity: string) => (
                            <Badge 
                              key={amenity}
                              variant="outline"
                              className="capitalize bg-green-50 text-green-700"
                            >
                              {amenity.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-sm text-gray-500 mb-2">Description de l'offre</p>
                      <p className="text-gray-700">{contract.offer.description}</p>
                    </div>
                  </CardContent>

                  <Separator />

                  <CardFooter className="px-6 py-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Contrat créé le {new Date(contract.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <Info className="h-4 w-4" /> Détails du contrat
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 