import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from './header';

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Section Hero avec image de fond */}
      <section className="relative">
        <img
          src="https://unsplash.com/photos/pJadQetzTkI/download?force=true"
          alt="Logement idéal"
          className="w-full h-96 object-cover"
        />
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-4">
          <h1 className="text-4xl font-bold mb-4">Bienvenue sur Rental Match</h1>
          <p className="text-xl mb-6">Trouvez ou proposez votre logement idéal facilement</p>
          <div className="flex gap-4">
            <Link to="/find-rental">
              <Button size="lg">Chercher un logement</Button>
            </Link>
            <Link to="/create-request">
              <Button size="lg" variant="secondary" className="bg-pink-500 hover:bg-pink-600 text-white">
                Publier une annonce
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Section "Comment ça marche ?" */}
        <section className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div>
              <img
                src="/images/step1.png"
                alt="Déposer une annonce"
                className="w-full h-96 object-cover rounded-lg shadow-md mb-4"
              />
              <h3 className="text-xl font-semibold">1. Déposez une annonce</h3>
              <p>Publiez votre recherche ou offre de logement en quelques clics.</p>
            </div>
            <div>
              <img
                src="/images/step2.png"
                alt="Recevoir des propositions"
                className="w-full h-96 object-cover rounded-lg shadow-md mb-4"
              />
              <h3 className="text-xl font-semibold">2. Recevez des propositions</h3>
              <p>Obtenez des offres personnalisées de nos partenaires et utilisateurs.</p>
            </div>
            <div>
              <img
                src="/images/step3.png"
                alt="Réserver en direct"
                className="w-full h-96 object-cover rounded-lg shadow-md mb-4"
              />
              <h3 className="text-xl font-semibold">3. Réservez en direct</h3>
              <p>Finalisez votre réservation directement via notre plateforme sécurisée.</p>
            </div>
          </div>
        </section>

        {/* Section "Dernières annonces populaires" */}
        {/* <section className="text-center py-20 bg-gray-100 rounded-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Dernières annonces populaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="border rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/listing1.jpg"
                alt="Appartement lumineux"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold">Appartement lumineux</h3>
                <p className="text-gray-600">Paris 11ème, 75011</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/listing2.jpg"
                alt="Studio moderne"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold">Studio moderne</h3>
                <p className="text-gray-600">Lyon, 69001</p>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden shadow-md">
              <img
                src="/images/listing3.jpg"
                alt="Maison de charme"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold">Maison de charme</h3>
                <p className="text-gray-600">Bordeaux, 33000</p>
              </div>
            </div>
          </div>
        </section> */}

        {/* Section "Ce que nos utilisateurs disent" */}
        <section className="text-center py-20">
          <h2 className="text-3xl font-bold mb-4">Ce que nos utilisateurs disent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="flex flex-col items-center">
              <img
                src="https://cdn.pixabay.com/photo/2016/11/29/13/14/attractive-1869761_1280.jpg"
                alt="Jean Dupont"
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              <p className="italic">"Grâce à Rental Match, j'ai trouvé le logement parfait en un rien de temps !"</p>
              <span className="mt-2 font-semibold">Jean Dupont</span>
            </div>
            <div className="flex flex-col items-center">
              <img
                src="https://cdn.pixabay.com/photo/2018/02/16/14/38/portrait-3157821_1280.jpg"
                alt="Marie Curie"
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              <p className="italic">"Une interface intuitive et des offres vraiment intéressantes."</p>
              <span className="mt-2 font-semibold">Marie Curie</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white shadow py-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex gap-4 mb-4 md:mb-0">
            <Link to="/about">À propos</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgu">CGU/CGV</Link>
          </div>
          <div className="flex gap-4">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Twitter">Twitter</a>
            <a href="#" aria-label="Instagram">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
