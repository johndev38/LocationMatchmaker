import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Header() {
  const { user, logoutMutation } = useAuth();

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md fixed w-full top-0 left-0 z-50 h-16 flex items-center">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-gray-600" />
          <h1 className="text-2xl font-bold text-gray-800">RentalMatch</h1>
        </div>
        <nav className="flex gap-4">
          <Link to="/" className="transition hover:text-pink-500">
            <Button variant="ghost">Accueil</Button>
          </Link>
          <Link to="/find-rental" className="transition hover:text-pink-500">
            <Button variant="ghost">Recherche</Button>
          </Link>
          <Link to="/create-request" className="transition hover:text-pink-500">
            <Button variant="ghost">Publier une annonce</Button>
          </Link>
          <Link to="/dashboard" className="transition hover:text-pink-500">
            <Button variant="ghost">Espace professionnel</Button>
          </Link>
          <Link to="/my-listings" className="transition hover:text-pink-500">
            <Button variant="ghost">Mes annonces</Button>
          </Link>
          {user ? (
            <Button
              variant="destructive"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="transition-transform transform hover:scale-105"
            >
              {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Déconnexion"}
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="default" className="transition-transform transform hover:scale-105">
                Connexion/Inscription
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
