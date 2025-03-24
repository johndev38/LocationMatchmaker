import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  body?: any,
  headers: HeadersInit = {}
): Promise<Response> {
  // Vérifier si l'utilisateur est authentifié via la session
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Nous utilisons uniquement credentials: 'include' pour transmettre les cookies de session
  // et n'utilisons pas de token Bearer qui causait l'erreur 401
  
  const mergedHeaders = { ...defaultHeaders, ...headers };
  
  const options: RequestInit = {
    method,
    headers: mergedHeaders,
    credentials: 'include', // Inclure les cookies pour l'authentification par session
  };
  
  if (body && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      console.error("Erreur d'authentification - Session expirée ou utilisateur non connecté");
      // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    
    return response;
  } catch (error) {
    console.error("Erreur lors de la requête API:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
