// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

export function createClerkSupabaseClient(session: any) {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_KEY!,
		{
			global: {
				fetch: async (url: RequestInfo | URL, options: RequestInit = {}) => {
					const clerkToken = await session?.getToken({
						template: "supabase",
					});
					const headers = new Headers(options.headers);
					headers.set("Authorization", `Bearer ${clerkToken}`);
					return fetch(url, { ...options, headers });
				},
			},
		},
	);
}
