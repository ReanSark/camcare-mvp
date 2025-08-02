"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { account, databases } from "@/lib/appwrite.client";
import { Query, Models } from "appwrite";

// Type for the context
interface AuthContextProps {
  user: Models.User<Record<string, unknown>> | null;
  role: string | null;
  loading: boolean;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextProps>({
  user: null,
  role: null,
  loading: true,
  logout: () => {},
});

// Context provider
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔐 Check for existing session on first load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get(); // Try to fetch current session
        const cachedRole = 
          typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

        setUser(user);
        setRole(cachedRole ?? null); // Fallback if role not yet cached
      } catch (err) {
        console.warn("🔐 No active session:", err);
        setUser(null);
        setRole(null); // No session found
        localStorage.removeItem("userRole"); // 🚿 clear stale cache
      } finally {
        setLoading(false); // ✅ Mark loading complete in all cases
      }
    };

    checkSession();
  }, []);

  // 🔓 Logout function — clears session and local state
  const logout = async () => {
    try {
      await account.deleteSession("current");
    } catch (err) {
      console.warn("Logout failed (maybe already logged out)", err);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      window.location.href = "/auth/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔁 Hook to access context
export const useAuth = () => useContext(AuthContext);