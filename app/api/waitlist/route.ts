import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, role, company_name } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email e ruolo sono obbligatori" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email non valida" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("waitlist").insert({
      email: email.trim().toLowerCase(),
      role,
      company_name: company_name?.trim() || null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Questa email è già registrata nella waitlist" }, { status: 409 });
      }
      return NextResponse.json({ error: "Errore durante l'iscrizione" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Errore del server" }, { status: 500 });
  }
}
