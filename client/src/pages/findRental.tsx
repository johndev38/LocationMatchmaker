import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Header from "./header"; // ✅ Import du Header

export default function FindRental() {
  const [selectedRequest, setSelectedRequest] = useState<number | null>(null);

  const { data: rentalRequests = [], isLoading: loadingRequests } = useQuery<any[]>({
    queryKey: ["rentalRequests"],
    queryFn: async () => {
      const response = await fetch("/api/rental-requests");
      if (!response.ok) throw new Error("Erreur lors de la récupération des demandes de location");
      return response.json();
    },
  });

  const { data: propertyOffers = [], isLoading: loadingOffers } = useQuery<any[]>({
    queryKey: ["propertyOffers", selectedRequest],
    enabled: selectedRequest !== null,
  });

  if (loadingRequests)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Ajout du Header */}
      <Header />

      {/* ✅ Ajout d'un padding-top pour éviter que le contenu soit caché par le header */}
      <main className="container mx-auto px-4 pt-20 pb-8 grid grid-cols-2 gap-6">
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Demandes de location</h2>
          {rentalRequests.length > 0 ? (
            rentalRequests.map((request: any) => (
              <Card
                key={request.id}
                className={`mb-4 cursor-pointer transition-transform transform hover:scale-105 ${
                  selectedRequest === request.id ? "border-2 border-pink-500" : ""
                }`}
                onClick={() => setSelectedRequest(request.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Demande #{request.id}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Budget : <span className="font-semibold">{request.maxBudget}€</span></p>
                  <p className="text-gray-600">Personnes : <span className="font-semibold">{request.peopleCount}</span></p>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-gray-500">Aucune demande pour le moment.</p>
          )}
        </section>

        {/* Section des Offres reçues */}
        {selectedRequest && (
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Offres reçues</h2>
            {loadingOffers ? (
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
              </div>
            ) : propertyOffers.length > 0 ? (
              propertyOffers.map((offer: any) => (
                <Card key={offer.id} className="mb-4 transition-transform transform hover:scale-105">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800">{offer.price} €</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{offer.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-gray-500">Aucune offre reçue pour cette demande.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
