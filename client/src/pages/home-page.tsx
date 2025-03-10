import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom'; // ✅ Utilisation de React Router
import { Button } from '@/components/ui/button';
import { Loader2, Home } from 'lucide-react';

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <h1 className="text-2xl font-bold">RentalMatch</h1>
          </div>
          <nav className="flex gap-4">
            <Link to="/">
              <Button variant="ghost">Accueil</Button>
            </Link>
            <Link to="/find-rental">
              <Button variant="ghost">Recherche</Button>
            </Link>
            <Link to="/create-request">
              <Button variant="ghost">Publier une annonce</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost">Espace professionnel</Button>
            </Link>
            {user ? (
              <Button
                variant="destructive"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Déconnexion'}
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="default">Connexion/Inscription</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Trouvez ou proposez votre logement idéal facilement</h2>
          <div className="flex justify-center gap-4 mb-8">
            <Link to="/find-rental">
              <Button size="lg">Chercher un logement</Button>
            </Link>
            <Link to="/create-request">
              <Button size="lg" variant="outline">Publier une annonce</Button>
            </Link>
          </div>
          <div className="my-12">
            <h3 className="text-2xl font-bold mb-6">Comment ça marche ?</h3>
            <ul className="space-y-2">
              <li>1. Déposez une annonce (locataire)</li>
              <li>2. Recevez des propositions (locataire)</li>
              <li>3. Réservez en direct (locataire/professionnel)</li>
            </ul>
          </div>
          <div className="my-12">
            <h3 className="text-2xl font-bold mb-6">Dernières annonces populaires</h3>
            <p>(À venir)</p>
          </div>
          <div className="my-12">
            <h3 className="text-2xl font-bold mb-6">Ce que nos utilisateurs disent</h3>
            <p>(À venir)</p>
          </div>
        </section>
      </main>

      <footer className="bg-white shadow py-4">
        <div className="container mx-auto flex justify-between">
          <div className="flex gap-4">
            <Link to="/about">À propos</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgu">CGU/CGV</Link>
          </div>
          <div className="flex gap-4">
            <a href="#">Facebook</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
