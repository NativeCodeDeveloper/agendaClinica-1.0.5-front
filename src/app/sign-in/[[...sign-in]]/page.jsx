"use client";

import {useEffect} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-900">Clerk desactivado temporalmente</p>
        <p className="mt-2 text-sm text-slate-500">Redirigiendo al dashboard...</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
        >
          Entrar al dashboard
        </Link>
      </div>
    </main>
  );
}
