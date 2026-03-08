import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { text } = body as { text?: unknown };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Message text is required and must be a string." },
        { status: 400 }
      );
    }

    const trimmed = text.trim();

    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty." },
        { status: 400 }
      );
    }

    if (trimmed.length > 1000) {
      return NextResponse.json(
        { error: "Message must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    // Insert message — user_id is set server-side to prevent spoofing
    const { data, error: insertError } = await supabase
      .from("messages")
      .insert({
        text: trimmed,
        user_id: user.id,
        user_email: user.email ?? "unknown",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save message." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
