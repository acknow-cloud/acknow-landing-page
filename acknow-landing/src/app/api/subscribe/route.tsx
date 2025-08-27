// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const bodySchema = z.object({ email: z.string().email() });

function getSupabase() {
    const env = z
        .object({
            REACT_APP_SUPABASE_URL: z.string().url(),
            REACT_APP_SUPABASE_ANON_KEY: z.string().min(10),
        })
        .safeParse({
            REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
            REACT_APP_SUPABASE_ANON_KEY: process.env.REACT_APP_SUPABASE_ANON_KEY,
        });

    if (!env.success) return { ok: false as const, issues: env.error.issues };

    const supabase = createClient(env.data.REACT_APP_SUPABASE_URL, env.data.REACT_APP_SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
    });
    return { ok: true as const, supabase };
}

export async function POST(req: Request) {
    // 1) validate body
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }

    // 2) get supabase lazily (so import не падает при пустых env)
    const sb = getSupabase();
    if (!sb.ok) {
        return NextResponse.json(
            {
                error: "env_missing",
                missing: sb.issues.map(i => i.path.join(".")),
            },
            { status: 500 }
        );
    }

    // 3) upsert
    const { email } = parsed.data;
    const { error } = await sb.supabase
        .from("waitlist_subscribers")
        .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });

    if (error && !/duplicate key/i.test(error.message)) {
        console.error(error);
        return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ status: "ok" });
}

// optional: health check без зависимостей
export async function GET() {
    return NextResponse.json({ ok: true });
}
