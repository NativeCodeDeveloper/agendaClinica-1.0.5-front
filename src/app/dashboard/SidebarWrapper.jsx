'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Michroma } from 'next/font/google';
import { getDashboardRoleFromUser, getVisibleDashboardSections } from '@/lib/dashboard-access';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from './UserMenu';

const michroma = Michroma({ weight: '400', subsets: ['latin'], display: 'swap' });

// ── Íconos del Rail ────────────────────────────────────────────────────────────
const RAIL_ICONS = {
    home: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    document: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    settings: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    folder: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
        </svg>
    ),
    image: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    budget: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
    ),
    shield: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
        </svg>
    ),
    academy: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.42A12.08 12.08 0 0119 15.12V18m-7-4l-6.16-3.42A12.08 12.08 0 005 15.12V18m7-4v6" />
        </svg>
    ),
};

// ── Helper: detecta sección activa según pathname ──────────────────────────────
function findActiveSectionId(sections, pathname) {
    for (const section of sections) {
        if (section.items.some(item => {
            if (item.href.startsWith('http')) return false;
            return item.href === pathname ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
        })) {
            return section.id;
        }
    }
    return sections[0]?.id || null;
}

// ── PanelNavItem ───────────────────────────────────────────────────────────────
function PanelNavItem({ href, label, pathname }) {
    const isExternal = href.startsWith('http');
    const isActive = !isExternal && (
        pathname === href ||
        (href !== '/dashboard' && pathname.startsWith(href))
    );

    return (
        <Link
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[12.5px] font-medium transition-all duration-150 ${
                isActive
                    ? 'bg-[#F3F0FF] text-[#6E56CF]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
        >
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors ${
                isActive ? 'bg-[#6E56CF]' : 'bg-slate-300 group-hover:bg-slate-400'
            }`} />
            <span className="leading-none whitespace-nowrap">{label}</span>
        </Link>
    );
}

// ── Rail avatar (mini, siempre visible) ───────────────────────────────────────
function RailAvatar({ user, isLoaded, onClick }) {
    if (!isLoaded) {
        return <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />;
    }
    const name  = user?.fullName || user?.firstName || 'U';
    const avatar = user?.imageUrl;
    return (
        <button
            onClick={onClick}
            title="Perfil de usuario"
            className="h-8 w-8 rounded-full overflow-hidden border-2 border-slate-200 hover:border-[#6E56CF] transition-colors bg-[#EDE9FE] flex items-center justify-center shrink-0 focus:outline-none"
        >
            {avatar
                ? <img src={avatar} alt={name} className="h-full w-full object-cover" />
                : <span className="text-[11px] font-bold text-[#6E56CF]">{name.charAt(0)}</span>
            }
        </button>
    );
}

// ── SidebarWrapper ─────────────────────────────────────────────────────────────
export default function SidebarWrapper() {
    const pathname  = usePathname();
    const { user, isLoaded } = useUser();
    const role     = getDashboardRoleFromUser(user);
    const sections = useMemo(() => getVisibleDashboardSections(role), [role]);

    const [activeSection, setActiveSection] = useState(sections[0]?.id || null);
    const [panelOpen,     setPanelOpen]     = useState(true);

    // Restaurar estado del panel desde localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('ac_panel_open');
            if (saved !== null) setPanelOpen(JSON.parse(saved));
        } catch {}
    }, []);

    // Sincronizar sección activa con la ruta actual
    useEffect(() => {
        const found = findActiveSectionId(sections, pathname);
        if (found) setActiveSection(found);
    }, [pathname, sections]);

    function handleSectionClick(sectionId) {
        if (activeSection === sectionId && panelOpen) {
            const next = false;
            setPanelOpen(next);
            try { localStorage.setItem('ac_panel_open', JSON.stringify(next)); } catch {}
        } else {
            setActiveSection(sectionId);
            const next = true;
            setPanelOpen(next);
            try { localStorage.setItem('ac_panel_open', JSON.stringify(next)); } catch {}
        }
    }

    function togglePanel() {
        const next = !panelOpen;
        setPanelOpen(next);
        try { localStorage.setItem('ac_panel_open', JSON.stringify(next)); } catch {}
    }

    const activeData  = sections.find(s => s.id === activeSection);
    const activeItems = activeData?.items || [];

    return (
        <aside className="hidden md:flex h-screen shrink-0 flex-row">

            {/* ═══════════ RAIL (62px, siempre visible) ═══════════ */}
            <div className="flex flex-col h-full w-[62px] bg-[#FCFCFD] border-r border-[#EAEAEC] shrink-0">

                {/* Logo mini */}
                <div className="flex flex-col items-center pt-3 pb-2 shrink-0">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-violet-400/10 blur-xl" />
                        </div>
                        <img src="/logo.png" alt="AC" className="relative h-9 w-9 object-contain drop-shadow-sm" />
                    </div>
                    <div className="mt-2 h-px w-8 bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />
                </div>

                {/* Íconos de sección */}
                <nav className="flex-1 flex flex-col items-center gap-1 py-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {sections.map(section => {
                        const active = activeSection === section.id && panelOpen;
                        return (
                            <button
                                key={section.id}
                                onClick={() => handleSectionClick(section.id)}
                                title={section.accordionLabel || section.title}
                                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-150 ${
                                    active
                                        ? 'bg-[#EDE9FE] text-[#6E56CF]'
                                        : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                            >
                                {RAIL_ICONS[section.icon] || RAIL_ICONS.home}
                                {active && (
                                    <span className="absolute -right-px top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[#6E56CF]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Avatar usuario (abre panel) */}
                <div className="shrink-0 flex flex-col items-center gap-2 py-3 border-t border-[#EAEAEC]">
                    <RailAvatar user={user} isLoaded={isLoaded} onClick={togglePanel} />
                </div>
            </div>

            {/* ═══════════ PANEL (196px, desliza) ═══════════ */}
            <div className={`flex flex-col h-full bg-white border-r border-[#EAEAEC] shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${
                panelOpen ? 'w-[196px]' : 'w-0'
            }`}>

                {/* Cabecera: nombre del módulo */}
                <div className="px-4 pt-4 pb-3 shrink-0">
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-16 w-16 rounded-full bg-violet-500/[0.05] blur-xl" />
                        </div>
                        <img
                            src="/logo.png"
                            alt="AgendaClinica"
                            className="relative h-24 w-full object-contain object-center drop-shadow-[0_0_10px_rgba(139,92,246,0.12)]"
                        />
                    </div>
                    <div className={`${michroma.className} -mt-1 text-center`}>
                        <p className="text-[10px] leading-tight text-slate-600 tracking-[0.06em] uppercase truncate">
                            {activeData?.accordionLabel || activeData?.title || 'Menú'}
                        </p>
                    </div>
                    <div className="mt-2 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
                </div>

                {/* Items del módulo */}
                <nav className="flex-1 overflow-y-auto px-2 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {activeItems.map(item => (
                        <PanelNavItem
                            key={item.href}
                            href={item.href}
                            label={item.label}
                            pathname={pathname}
                        />
                    ))}
                </nav>

                {/* Notificaciones */}
                <div className="px-2 pb-1 border-t border-slate-100 pt-2 shrink-0">
                    <NotificationBell />
                </div>

                {/* Usuario */}
                <UserMenu />
            </div>
        </aside>
    );
}
