// src/context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";

interface UserType {
  id: string;
  email: string;
  role: "customer" | "admin" | "technician";
  name?: string;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Helper: map Supabase user to our UserType
const mapSupabaseUser = (supaUser: SupabaseUser): UserType => ({
  id: supaUser.id,
  email: supaUser.email ?? "",
  role: "customer", // default, you can extend later
  name: supaUser.user_metadata?.name ?? undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let listener: ReturnType<typeof supabase.auth.onAuthStateChange> | null = null;

    const initAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        }

        setLoading(false);

        // Subscribe to auth changes
        listener = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) setUser(mapSupabaseUser(session.user));
          else setUser(null);
        });
      } catch (err) {
        console.error("Error initializing auth:", err);
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup
    return () => {
      if (listener && listener.data?.subscription) listener.data.subscription.unsubscribe();
    };
  }, []);

  // Register user via backend API
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("customer", JSON.stringify(data.user));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Login user via backend API
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setUser(data.user);
      localStorage.setItem("token", data.token);
      localStorage.setItem("customer", JSON.stringify(data.user));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth
export const useAuth = () => useContext(AuthContext);
