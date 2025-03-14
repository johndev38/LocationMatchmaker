import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Navigate } from "react-router-dom";
import { Building2, Home, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

// Schéma de validation pour le formulaire de connexion
const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

// Type pour les données de connexion
type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      isLandlord: false,
      email: "",
      address: "",
      phone: "",
    },
  });

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await apiRequest("GET", "/api/check-auth");
        const data = await res.json();
        if (data.authenticated) {
          console.log("User is authenticated");
        }
      } catch (error) {
        console.error("Failed to check auth", error);
      }
    }

    checkAuth();
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to RentalMatch</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={loginForm.handleSubmit((data) =>
                    loginMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="login-username">Username</Label>
                    <Input
                      id="login-username"
                      {...loginForm.register("username")}
                    />
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register("password")}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500 mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Login
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={registerForm.handleSubmit((data) =>
                    registerMutation.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="register-username">Username</Label>
                    <Input
                      id="register-username"
                      {...registerForm.register("username")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      {...registerForm.register("email")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      {...registerForm.register("password")}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="landlord"
                      checked={registerForm.watch("isLandlord")}
                      onCheckedChange={(checked) => {
                        registerForm.setValue("isLandlord", checked === true);
                      }}
                    />
                    <Label htmlFor="landlord" className="cursor-pointer" onClick={() => {
                      const currentValue = registerForm.getValues("isLandlord");
                      registerForm.setValue("isLandlord", !currentValue);
                    }}>
                      Je suis propriétaire
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-primary/5">
        <div className="max-w-md mx-auto space-y-8">
          <h2 className="text-3xl font-bold">Find Your Perfect Match</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Home className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">For Tenants</h3>
                <p className="text-muted-foreground">
                  Post your requirements and receive personalized offers from
                  property owners.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="font-semibold">For Property Owners</h3>
                <p className="text-muted-foreground">
                  Browse tenant requests and make competitive offers to maximize
                  occupancy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
