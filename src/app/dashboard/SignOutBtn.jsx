"use client";

import {useRouter} from "next/navigation";

export default function SignOutBtn() {
    const router = useRouter();

    return (
        <button
            onClick={() => router.push("/")}
            className="group/link flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all duration-200 shadow-sm"
            title="Salir del dashboard temporal"
        >
            <svg className="h-4 w-4 transition-colors duration-200 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
            </svg>
            <span className="leading-none">Salir</span>
        </button>
    );
}
