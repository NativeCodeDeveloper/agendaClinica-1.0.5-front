import Link from "next/link";

export default function Page() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                <p className="text-sm font-bold text-slate-900">Registro desactivado temporalmente</p>
                <p className="mt-2 text-sm text-slate-500">Clerk esta desactivado mientras se realizan pruebas.</p>
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
