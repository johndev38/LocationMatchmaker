import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import CreateRentalRequest from "./pages/createRentalRequest";
import { ProtectedRoute } from "./lib/protected-route";
import FindRental from "./pages/findRental";
import MyListings from "./pages/myListings";
import MyInformation from "./pages/MyInformation";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />

            {/* ✅ Utilisation correcte de ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/find-rental" element={<FindRental />} />
              <Route path="/my-listings" element={<MyListings />} />
              <Route path="/create-request" element={<CreateRentalRequest />} />
              <Route path="/profile" element={<MyInformation />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
