import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  authenticateUser,
  authenticateGoogleUser,
  authenticateSocialUser,
  ensureDemoState,
  getSessionUser,
  registerCustomer,
  signOutUser,
  type SessionUser,
} from "@/lib/demo-store";
import {
  getSupabaseBrowserClient,
  getSupabaseSessionUser,
  hasSupabaseConfig,
  listenToSupabaseAuth,
} from "@/lib/supabase";
import { getProfile, upsertProfile } from "@/lib/data";

type SignInInput = {
  credential: string;
  password: string;
};

type SignUpInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

type AuthResult = { ok: true; user: SessionUser | null } | { ok: false; error: string };

const Ctx = createContext<{
  user: SessionUser | null;
  hydrated: boolean;
  signIn: (input: SignInInput) => Promise<AuthResult>;
  signUp: (input: SignUpInput) => Promise<AuthResult>;
  signInWithGoogle: (input: {
    email: string;
    name: string;
    googleSubject: string;
  }) => Promise<AuthResult>;
  signInWithFacebook: (input: {
    email: string;
    name: string;
    facebookSubject: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const syncSupabaseProfile = async (sessionUser: SessionUser | null) => {
    if (!sessionUser || !hasSupabaseConfig()) {
      return sessionUser;
    }

    const profile = await getProfile(sessionUser.id);
    if (!profile) {
      await upsertProfile({
        userId: sessionUser.id,
        fullName: sessionUser.name,
        phone: sessionUser.phone,
      });
      return sessionUser;
    }

    return {
      ...sessionUser,
      name: profile.full_name || sessionUser.name,
      phone: profile.phone || sessionUser.phone,
      role: profile.role || sessionUser.role,
      branches: (profile.assigned_branches ?? []) as SessionUser["branches"],
    };
  };

  useEffect(() => {
    ensureDemoState();
    const bootstrap = async () => {
      if (hasSupabaseConfig()) {
        const sessionUser = await getSupabaseSessionUser();
        setUser(await syncSupabaseProfile(sessionUser));
      } else {
        setUser(getSessionUser());
      }
      setHydrated(true);
    };

    void bootstrap();

    let cancelled = false;
    let subscription: { unsubscribe: () => void } | null = null;

    void listenToSupabaseAuth((nextUser) => {
      void (async () => {
        setUser(await syncSupabaseProfile(nextUser));
      })();
    }).then((nextSubscription) => {
      if (cancelled) {
        nextSubscription?.unsubscribe();
        return;
      }
      subscription = nextSubscription;
    });

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (input: SignInInput) => {
    const supabase = await getSupabaseBrowserClient();
    if (supabase) {
      const normalizedCredential = input.credential.trim();
      const isEmail = normalizedCredential.includes("@");
      const credentials = isEmail
        ? { email: normalizedCredential, password: input.password }
        : { phone: normalizedCredential, password: input.password };

      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) {
        return { ok: false as const, error: error.message || "auth.supabaseSignInFailed" };
      }

      const nextUser = await syncSupabaseProfile(await getSupabaseSessionUser());
      setUser(nextUser);
      return { ok: true as const, user: nextUser };
    }

    const result = authenticateUser(input);
    if (!result.ok) {
      return result;
    }

    setUser(result.user);
    return { ok: true as const, user: result.user };
  };

  const signUp = async (input: SignUpInput) => {
    const supabase = await getSupabaseBrowserClient();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            name: input.name.trim(),
            phone: input.phone.trim(),
          },
        },
      });

      if (error) {
        return { ok: false as const, error: error.message || "auth.supabaseSignUpFailed" };
      }

      const nextUser = await syncSupabaseProfile(await getSupabaseSessionUser());
      setUser(nextUser);
      return { ok: true as const, user: nextUser };
    }

    const result = registerCustomer(input);
    if (!result.ok) {
      return result;
    }

    setUser(result.user);
    return { ok: true as const, user: result.user };
  };

  const signInWithGoogle = async (input: {
    email: string;
    name: string;
    googleSubject: string;
  }) => {
    const result = authenticateGoogleUser(input);
    if (!result.ok) {
      return result;
    }

    setUser(result.user);
    return { ok: true as const, user: result.user };
  };

  const signInWithFacebook = async (input: {
    email: string;
    name: string;
    facebookSubject: string;
  }) => {
    const result = authenticateSocialUser({
      email: input.email,
      name: input.name,
      provider: "facebook",
      subject: input.facebookSubject,
    });
    if (!result.ok) {
      return result;
    }

    setUser(result.user);
    return { ok: true as const, user: result.user };
  };

  const signOut = async () => {
    const supabase = await getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    signOutUser();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, hydrated, signIn, signUp, signInWithGoogle, signInWithFacebook, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
};
