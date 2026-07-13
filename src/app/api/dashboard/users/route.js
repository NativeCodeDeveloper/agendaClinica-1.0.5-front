import {NextResponse} from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Clerk esta desactivado temporalmente. No se pueden crear usuarios en este momento.",
    },
    {status: 503}
  );
}
