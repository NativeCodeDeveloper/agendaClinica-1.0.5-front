import { NextResponse } from "next/server";

// TEMPORAL: Clerk desactivado para permitir acceso directo al dashboard.
// Para reactivar autenticacion y permisos, restaurar el middleware Clerk anterior.
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/dashboard/:path*"],
};
