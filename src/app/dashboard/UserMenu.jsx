"use client";

import Link from "next/link";

export default function UserMenu() {
    return (
        <div className="px-3 pb-3 pt-2 border-t border-[#EAEAEC]">
            <div className="overflow-hidden rounded-2xl border border-violet-100 bg-[#F8F7FC]">
                <div className="flex items-center gap-3 px-3 py-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#EDE9FE] text-[#6E56CF]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.105.895-2 2-2s2 .895 2 2v1m-7 0V9a3 3 0 016 0m-8 3h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" />
                        </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-tight text-slate-800">
                            Acceso temporal
                        </p>
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">
                            Clerk desactivado
                        </p>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" title="Acceso habilitado" />
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2.5 border-t border-violet-100 px-4 py-3 text-[12px] font-medium text-slate-600 transition-all hover:bg-white/70 hover:text-[#6E56CF]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>Volver a pagina web</span>
                </Link>
            </div>
        </div>
    );
}
