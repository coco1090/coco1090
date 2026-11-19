import { NextResponse } from "next/server";
import { clearAdminSession } from "@/lib/session";

export async function POST(req: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/admin/login", new URL(req.url).origin), 303);
}
