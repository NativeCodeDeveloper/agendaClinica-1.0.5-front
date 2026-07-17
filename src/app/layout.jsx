import "./globals.css";
import { AnimatedLayout } from "@/Componentes/AnimatedLayout";
import AgendaProvider from "@/ContextosGlobales/AgendaContext";
import { Inter, Lora, Michroma, Outfit } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const michroma = Michroma({
  subsets: ["latin"],
  variable: "--font-michroma",
  weight: "400",
});

export const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://agendaclinica.cl");
const metadataImage = "/Copia%20de%20logoagendaclinica.png";

export const metadata = {
  metadataBase,
  title: {
    default: "Agenda Clínica | Sistema de Agendamiento Médico Online",
    template: "%s | Agenda Clínica",
  },
  description:
    "Agenda tu hora médica de forma rápida y sencilla. Plataforma de agendamiento clínico online para profesionales de la salud. Reserva tu cita en segundos.",
  keywords: [
    "agenda clínica",
    "agendar hora médica",
    "reserva de hora online",
    "citas médicas online",
    "agendamiento clínico",
    "agenda profesional salud",
    "reservar cita médica",
    "sistema de agendamiento",
    "atención clínica",
    "agenda online médica",
    "hora médica online",
    "plataforma salud",
  ],
  authors: [{ name: "Agenda Clínica", url: metadataBase.href }],
  publisher: "Agenda Clínica",
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  alternates: {
    canonical: metadataBase.href,
  },
  icons: {
    icon: "/logofavcom.png",
    shortcut: "/logofavcom.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Agenda Clínica | Sistema de Agendamiento Médico Online",
    description:
      "Agenda tu hora médica de forma rápida y sencilla. Plataforma de agendamiento clínico online para profesionales de la salud.",
    url: metadataBase.href,
    siteName: "Agenda Clínica",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: metadataImage,
        width: 1536,
        height: 1024,
        alt: "Agenda Clínica - Sistema de Agendamiento Médico Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agenda Clínica | Agendamiento Médico Online",
    description: "Reserva tu hora médica en segundos. Plataforma de agendamiento clínico online.",
    images: [metadataImage],
  },
};

export default function RootLayout({ children }) {
  const serviceWorkerScript = process.env.NODE_ENV === "production"
    ? `
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').catch(function() {});
        });
      }
    `
    : `
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          registrations.forEach(function(registration) {
            registration.unregister();
          });
        });
      }
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          keys.filter(function(key) {
            return key.startsWith('ac-shell-');
          }).forEach(function(key) {
            caches.delete(key);
          });
        });
      }
    `;

  return (
    <html lang="es" data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable} ${lora.variable} ${michroma.variable}`}>
      <body className="min-h-screen bg-white">
        {/*
          AgendaProvider DEBE envolver AnimatedLayout (no estar dentro).
          AnimatedLayout desmonta/remonta sus hijos en cada navegación
          (usa key={pathname} + AnimatePresence). Si AgendaProvider
          estuviera adentro, su estado (fecha, hora, servicio) se reiniciaría
          en cada cambio de ruta, perdiendo los datos entre el calendario y el formulario.
        */}
        <AgendaProvider>
          <AnimatedLayout>
            {children}
          </AnimatedLayout>
        </AgendaProvider>
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />
      </body>
    </html>
  );
}
