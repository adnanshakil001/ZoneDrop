import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth as useClerkAuth, useClerk, useSignIn } from "@clerk/clerk-react";
import { api, getToken, setToken, setTokenGetter } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "AGENT" | "ADMIN";
  phone?: string | null;
  agentProfile?: {
    isAvailable: boolean;
    maxActiveOrders: number;
    currentZone?: { name: string; code: string } | null;
  } | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void | Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = clerkPublishableKey && !clerkPublishableKey.includes("YOUR_PUBLISHABLE_KEY");

function ClerkConnectedAuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, getToken: getClerkToken } = useClerkAuth();
  const { signOut } = useClerk();
  const { signIn } = useSignIn();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bind API client to Clerk's session token getter
  useEffect(() => {
    if (isClerkEnabled) {
      setTokenGetter(async () => {
        if (isSignedIn) {
          return getClerkToken();
        }
        return getToken();
      });
    }
  }, [isSignedIn, getClerkToken]);

  async function refresh() {
    try {
      if (isSignedIn) {
        const me = await api<User>("/api/auth/me");
        setUser(me);
      } else if (getToken()) {
        const me = await api<User>("/api/auth/me");
        setUser(me);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoaded) {
      void refresh();
    }
  }, [isLoaded, isSignedIn]);

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(body: { name: string; email: string; password: string; phone?: string }) {
    const data = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signInWithGoogle() {
    if (!signIn) throw new Error("Clerk SignIn not initialized");
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/app",
    });
  }

  async function logout() {
    if (isSignedIn) {
      await signOut();
    }
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading: loading || !isLoaded, login, register, signInWithGoogle, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function login(email: string, password: string) {
    const data = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(body: { name: string; email: string; password: string; phone?: string }) {
    const data = await api<{ token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signInWithGoogle() {
    throw new Error("Clerk is not configured. Please add VITE_CLERK_PUBLISHABLE_KEY to frontend/.env");
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, login, register, signInWithGoogle, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isClerkEnabled) {
    return <ClerkConnectedAuthProvider>{children}</ClerkConnectedAuthProvider>;
  }
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}

export function homePath(role: User["role"]) {
  if (role === "ADMIN") return "/admin";
  if (role === "AGENT") return "/agent";
  return "/app";
}
