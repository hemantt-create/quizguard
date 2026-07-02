"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { fetchAdminProfileByEmail } from "@/lib/admin-auth";
import { clearStoredAdmin } from "@/lib/quiz-storage";
import { supabase } from "@/src/lib/supabase";

type AdminGuardProps = {
  children: ReactNode;
};

function AccessChecking() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f6f7fb] px-6 py-10 text-[#17202a]">
      <section className="w-full max-w-md rounded-lg border border-dashed border-[#cbd5e1] bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-[#64748b]">
          QuizGuard - Electrical Department, UIT RGPV Bhopal
        </p>
        <h1 className="mt-3 text-2xl font-bold text-[#101828]">
          Checking admin access...
        </h1>
      </section>
    </main>
  );
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function redirectToLogin() {
      clearStoredAdmin();

      if (supabase) {
        await supabase.auth.signOut();
      }

      if (isMounted) {
        setIsAuthorized(false);
        setHasLoaded(true);
      }

      router.replace("/admin/login");
    }

    async function checkAdminAccess() {
      setHasLoaded(false);
      setIsAuthorized(false);
      clearStoredAdmin();

      if (!supabase) {
        await redirectToLogin();
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      const email = data.session?.user.email?.toLowerCase();

      if (error || !email) {
        await redirectToLogin();
        return;
      }

      const adminResult = await fetchAdminProfileByEmail(email);

      if (adminResult.error || !adminResult.data) {
        await redirectToLogin();
        return;
      }

      if (isMounted) {
        setIsAuthorized(true);
        setHasLoaded(true);
      }
    }

    void checkAdminAccess();

    const { data: authListener } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        if (!session?.user.email) {
          router.replace("/admin/login");
        }
      }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      authListener.subscription?.unsubscribe();
    };
  }, [router]);

  if (!hasLoaded || !isAuthorized) {
    return <AccessChecking />;
  }

  return children;
}
