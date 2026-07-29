"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  fullName: string;
  firstName: string;
  primaryEmailAddress: {
    emailAddress: string | undefined;
  };
  imageUrl: string;
  publicMetadata: {
    [key: string]: unknown;
  };
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.warn("Supabase auth error:", error.message);
        }
        if (data?.user) {
          setUser(mapSupabaseUser(data.user));
        }
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
        setIsLoaded(true);
      });
  }, []);

  return { user, isLoaded, isSignedIn: !!user };
}

export function useClerk() {
  const supabase = createClient();

  return {
    signOut: async (callback?: () => void) => {
      await supabase.auth.signOut();
      if (callback && typeof callback === "function") {
        callback();
      } else {
        window.location.href = "/";
      }
    },
    openSignIn: () => {
      window.location.href = "/sign-in";
    },
    openSignUp: () => {
      window.location.href = "/sign-up";
    },
  };
}

function mapSupabaseUser(user: User): AppUser {
  return {
    id: user.id,
    fullName: user.user_metadata?.full_name || "User",
    firstName: user.user_metadata?.full_name?.split(" ")[0] || "User",
    primaryEmailAddress: {
      emailAddress: user.email,
    },
    imageUrl: user.user_metadata?.avatar_url || "",
    publicMetadata: user.user_metadata || {},
  };
}
