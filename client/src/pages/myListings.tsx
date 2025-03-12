import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import Header from "./header";
import { useQueryClient } from "@tanstack/react-query";

export default function MyListings() {
  const queryClient = useQueryClient();

  const { data: myListings = [], isLoading } = useQuery<any[]>({
    queryKey: ["myListings"],
    queryFn: async () => {
      const response = await fetch("/api/my-listings");
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des annonces");
      return response.json();
    },
  });

  const deleteListing = async (id: number) => {
    try {
      const response = await fetch(`/api/rental-requests/${id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Erreur lors de la suppression de l'annonce");
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["myListings"] });
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mes annonces</h2>
        {myListings.length > 0 ? (
          myListings.map((listing: any) => (
            <Card
              key={listing.id}
              className="mb-4 transition-transform transform hover:scale-105"
            >
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  Annonce #{listing.id}
                </CardTitle>
                <Trash2
                  className="h-5 w-5 text-red-500 cursor-pointer"
                  onClick={() => deleteListing(listing.id)}
                />
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Prix :{" "}
                  <span className="font-semibold">{listing.price}€</span>
                </p>
                <p className="text-gray-600">
                  Description :{" "}
                  <span className="font-semibold">{listing.description}</span>
                </p>
                <p className="text-gray-600">
                  Ville de départ :{" "}
                  <span className="font-semibold">{listing.departureCity}</span>
                </p>
                <p className="text-gray-600">
                  Période :{" "}
                  <span className="font-semibold">
                    {listing.startDate
                      ? new Date(listing.startDate).toLocaleDateString()
                      : "-"}{" "}
                    -{" "}
                    {listing.endDate
                      ? new Date(listing.endDate).toLocaleDateString()
                      : "-"}
                  </span>
                </p>
                <p className="text-gray-600">
                  Types de destination :{" "}
                  <span className="font-semibold">
                    {Array.isArray(listing.locationType)
                      ? listing.locationType.join(", ")
                      : listing.locationType}
                  </span>
                </p>
                <p className="text-gray-600">
                  Distance maximale :{" "}
                  <span className="font-semibold">{listing.maxDistance} km</span>
                </p>
                <p className="text-gray-600">
                  Budget maximum :{" "}
                  <span className="font-semibold">{listing.maxBudget}€</span>
                </p>
                <p className="text-gray-600">
                  Voyageurs :{" "}
                  <span className="font-semibold">
                    {listing.adults} Adultes, {listing.children} Enfants,{" "}
                    {listing.babies} Bébés, {listing.pets} Animaux
                  </span>
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-500">Aucune annonce pour le moment.</p>
        )}
      </main>
    </div>
  );
}
