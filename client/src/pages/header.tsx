import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Loader2, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@radix-ui/react-popover";
import NotificationCenter from "@/components/NotificationCenter";

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
          {/* <Link to="/find-rental" className="transition hover:text-pink-500">
            <Button variant="ghost">Recherche</Button>
          </Link> */}
          {!user?.isLandlord && (
            <Link to="/create-request" className="transition hover:text-pink-500">
              <Button variant="ghost">Publier une annonce</Button>
            </Link>
          )}
          {user?.isLandlord && (
            <>
              <Link to="/dashboard" className="transition hover:text-pink-500">
                <Button variant="ghost">Espace professionnel</Button>
              </Link>
              <Link to="/landlord-offers" className="transition hover:text-pink-500">
                <Button variant="ghost">Mes offres</Button>
              </Link>
            </>
          )}
          {user && (
            <Link to="/my-listings" className="transition hover:text-pink-500">
              <Button variant="ghost">Mes annonces</Button>
            </Link>
          )}
          {user ? (
            <>
              <NotificationCenter />
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300">
                    <User className="h-6 w-6 text-gray-600" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-2 bg-white shadow-md rounded-md">
                  <ul className="flex flex-col gap-2">
                    <li>
                      <Link to="/profile" className="text-gray-800 hover:text-pink-500">
                        Mes informations
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={() => logoutMutation.mutate()}
                        className="text-gray-800 hover:text-pink-500"
                      >
                        Déconnexion
                      </button>
                    </li>
                  </ul>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <Link to="/auth">
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
