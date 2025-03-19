import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from './header';
import { ArrowRight, Home, Search, MessageSquare, Star, CheckCircle, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Section Hero avec effet de parallaxe */}
      <section className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070"
            alt="Logement de rêve"
            className="w-full h-full object-cover brightness-[0.85] transform scale-105"
            style={{ 
              transformOrigin: 'center center',
              animation: 'slowly-zoom 30s infinite alternate ease-in-out' 
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-10"></div>
        <div className="relative z-20 container mx-auto h-full flex flex-col justify-center px-4 lg:px-0">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Trouvez votre <span className="text-pink-500">hébergement idéal</span> sans effort
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl">
              Rental Match connecte les locataires aux propriétaires pour des expériences de location exceptionnelles. Publiez une annonce ou trouvez votre prochain logement en quelques clics.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/find-rental">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 font-semibold text-base px-6 transition-all hover:translate-y-[-2px]">
                  <Search className="h-5 w-5 mr-2" />
                  Chercher un logement
                </Button>
              </Link>
              <Link to="/create-request">
                <Button size="lg" variant="default" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-base px-6 transition-all hover:translate-y-[-2px]">
                  <Home className="h-5 w-5 mr-2" />
                  Publier une annonce
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Forme décorative */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white z-10" style={{ 
          clipPath: 'polygon(0 100%, 100% 100%, 100% 0)',
          opacity: 0.1 
        }}></div>
      </section>

      <main className="relative z-10">
        {/* Section avantages */}
        <section className="py-20 container mx-auto px-4 lg:px-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir <span className="text-pink-500">Rental Match</span> ?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Notre plateforme facilite la mise en relation entre locataires et propriétaires avec un processus simplifié et sécurisé.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Recherche ciblée</h3>
              <p className="text-gray-600">Trouvez exactement ce que vous cherchez grâce à nos filtres personnalisés.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Communication directe</h3>
              <p className="text-gray-600">Échangez facilement avec les propriétaires ou locataires potentiels.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Processus simplifié</h3>
              <p className="text-gray-600">De la recherche à la réservation, tout se fait en quelques étapes simples.</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Offres de qualité</h3>
              <p className="text-gray-600">Des logements vérifiés pour une expérience sans mauvaise surprise.</p>
            </div>
          </div>
        </section>

        {/* Section Comment ça marche */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 lg:px-0">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Trois étapes simples pour trouver ou proposer un logement sur notre plateforme.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Ligne de connexion */}
              <div className="hidden md:block absolute top-32 left-[25%] right-[25%] h-1 bg-pink-200 z-0"></div>
              
              <div className="bg-white rounded-xl shadow-md p-6 relative z-10">
                <div className="bg-pink-500 text-white h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto">1</div>
                <div className="aspect-video mb-6 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1484156818044-c040038b0719?q=80&w=2080"
                    alt="Créer une annonce"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Créez votre annonce</h3>
                <p className="text-gray-600 text-center mb-4">Décrivez votre besoin ou votre logement en quelques minutes avec tous les détails nécessaires.</p>
                <Link to="/create-request" className="flex items-center justify-center text-pink-500 font-medium hover:text-pink-600">
                  Commencer maintenant <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6 relative z-10">
                <div className="bg-pink-500 text-white h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto">2</div>
                <div className="aspect-video mb-6 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1577415124269-fc1140a69e91?q=80&w=1974"
                    alt="Recevoir des offres"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Recevez des propositions</h3>
                <p className="text-gray-600 text-center mb-4">Les propriétaires ou locataires intéressés vous contacteront avec leurs meilleures offres.</p>
                <Link to="/my-listings" className="flex items-center justify-center text-pink-500 font-medium hover:text-pink-600">
                  Voir mes annonces <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-6 relative z-10">
                <div className="bg-pink-500 text-white h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold mb-6 mx-auto">3</div>
                <div className="aspect-video mb-6 overflow-hidden rounded-lg">
                  <img
                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1973"
                    alt="Finaliser l'accord"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Finalisez votre accord</h3>
                <p className="text-gray-600 text-center mb-4">Choisissez l'offre qui vous convient et confirmez la réservation en toute sécurité.</p>
                <a href="#" className="flex items-center justify-center text-pink-500 font-medium hover:text-pink-600">
                  En savoir plus <ChevronRight className="h-4 w-4 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section témoignages */}
        <section className="py-20 container mx-auto px-4 lg:px-0">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Ce que nos utilisateurs disent</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Découvrez les expériences des personnes qui ont utilisé notre plateforme.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full border-4 border-white shadow-sm overflow-hidden">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Sophie Martin"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-8 text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="italic text-gray-600 mb-4">"Grâce à Rental Match, j'ai trouvé l'appartement parfait en moins d'une semaine. Le processus était simple et efficace !"</p>
                <p className="font-semibold">Sophie Martin</p>
                <p className="text-sm text-gray-500">Locataire</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full border-4 border-white shadow-sm overflow-hidden">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Thomas Durand"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-8 text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="italic text-gray-600 mb-4">"En tant que propriétaire, j'ai pu trouver des locataires sérieux très rapidement. La plateforme est intuitive et efficace."</p>
                <p className="font-semibold">Thomas Durand</p>
                <p className="text-sm text-gray-500">Propriétaire</p>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="h-12 w-12 rounded-full border-4 border-white shadow-sm overflow-hidden">
                  <img
                    src="https://randomuser.me/api/portraits/women/68.jpg"
                    alt="Julie Leclerc"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-8 text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(4)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                  <Star className="h-5 w-5 text-gray-300" />
                </div>
                <p className="italic text-gray-600 mb-4">"Le système de mise en relation est excellent. J'ai reçu plusieurs offres correspondant parfaitement à mes critères."</p>
                <p className="font-semibold">Julie Leclerc</p>
                <p className="text-sm text-gray-500">Locataire</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call-to-action */}
        <section className="bg-gradient-to-r from-pink-500 to-pink-600 py-16">
          <div className="container mx-auto px-4 lg:px-0 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Prêt à trouver votre logement idéal ?</h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">Rejoignez notre communauté et commencez dès aujourd'hui votre recherche ou publiez votre annonce.</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/create-request">
                <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 font-semibold">
                  Publier une annonce
                </Button>
              </Link>
              <Link to="/find-rental">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-semibold">
                  Chercher un logement
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 lg:px-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Rental Match</h3>
              <p className="text-gray-400 mb-4">La meilleure plateforme pour trouver ou proposer un logement en toute simplicité.</p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Liens rapides</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/find-rental" className="text-gray-400 hover:text-white transition-colors">Rechercher</Link></li>
                <li><Link to="/create-request" className="text-gray-400 hover:text-white transition-colors">Publier une annonce</Link></li>
                <li><Link to="/my-listings" className="text-gray-400 hover:text-white transition-colors">Mes annonces</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Informations</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">À propos</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Légal</h3>
              <ul className="space-y-2">
                <li><Link to="/mentions-legales" className="text-gray-400 hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link to="/cgu" className="text-gray-400 hover:text-white transition-colors">CGU/CGV</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/cookies" className="text-gray-400 hover:text-white transition-colors">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 mt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Rental Match. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Animation CSS */}
      <style>{`
        @keyframes slowly-zoom {
          0% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
