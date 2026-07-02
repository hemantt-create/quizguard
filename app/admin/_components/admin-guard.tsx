"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { useStoredAdminIdentity } from "@/lib/use-local-identity";

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
          Checking access...
        </h1>
      </section>
    </main>
  );
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { admin, hasLoaded } = useStoredAdminIdentity();

  useEffect(() => {
    if (hasLoaded && !admin) {
      router.replace("/admin/login");
    }
  }, [admin, hasLoaded, router]);

  if (!hasLoaded || !admin) {
    return <AccessChecking />;
  }

  return children;
}
