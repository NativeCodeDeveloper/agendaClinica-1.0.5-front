import { ClerkProvider } from "@clerk/nextjs";
import MobileNav from "./MobileNav";
import SidebarWrapper from "./SidebarWrapper";
import NotificationProvider from "@/components/NotificationProvider";
import DashboardPageTransition from "@/components/DashboardPageTransition";
import CortexAssistant from "@/Componentes/CortexAssistant";

export const metadata = {
    title: "Dashboard — Agenda Clínica",
    description: "Panel de administración clínica",
};

// ─── Layout principal ─────────────────────────────────────────────────────────
export default function DashboardLayout({ children }) {
    return (
        <ClerkProvider>
            <div className="h-screen w-full overflow-hidden bg-[#FAFAFB]">
                <div className="flex h-full w-full">

                    {/* ═══════════════ SIDEBAR DOBLE (Rail + Panel) ═══════════════ */}
                    <SidebarWrapper />

                    {/* ═══════════════ CONTENT ═══════════════ */}
                    <div className="flex-1 min-w-0 h-full overflow-y-auto">
                        <MobileNav />
                        <main className="min-w-0">
                            <DashboardPageTransition>
                                {children}
                            </DashboardPageTransition>
                        </main>
                    </div>

                    <CortexAssistant />

                </div>
            </div>
            <NotificationProvider />
        </ClerkProvider>
    );
}

