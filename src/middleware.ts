import { clerkMiddleware, auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
	const { userId } = await auth();

	// Only run redirect logic on logged-in users and non-API routes
	if (
		userId &&
		!req.nextUrl.pathname.startsWith("/api") &&
		req.nextUrl.pathname !== "/select-metadata"
	) {
		const user = await clerkClient.users.getUser(userId);
		const hasRole = !!user.publicMetadata?.role;

		if (!hasRole) {
			const url = req.nextUrl.clone();
			url.pathname = "/select-metadata";
			return NextResponse.redirect(url);
		}
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
