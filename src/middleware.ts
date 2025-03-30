import { clerkMiddleware } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
	console.log("Middleware triggered");

	const { userId } = await auth();
	console.log("User ID:", userId);

	const pathname = req.nextUrl.pathname;
	console.log("Request pathname:", pathname);

	if (
		userId &&
		!pathname.startsWith("/api") &&
		!["/select-metadata", "/unauthorized", "/", "/event-portal"].includes(pathname)
	) {
		const user = await clerkClient.users.getUser(userId);
		const role = user.publicMetadata?.role;
		console.log("User role:", role);

		if (!role) {
			console.log("No role found. Redirecting to /select-metadata");
			const url = req.nextUrl.clone();
			url.pathname = "/select-metadata";
			return NextResponse.redirect(url);
		}

		if (role === "participant" && pathname !== "/") {
			console.log("Participant not on '/', redirecting...");
			const url = req.nextUrl.clone();
			url.pathname = "/";
			return NextResponse.redirect(url);
		}

		if (role === "coordinator" && pathname !== "/event-portal") {
			console.log("Coordinator not on '/event-portal', redirecting...");
			const url = req.nextUrl.clone();
			url.pathname = "/event-portal";
			return NextResponse.redirect(url);
		}

		if (!["participant", "coordinator"].includes(String(role)) && pathname !== "/unauthorized") {
			console.log("Unknown role, redirecting to /unauthorized");
			const url = req.nextUrl.clone();
			url.pathname = "/unauthorized";
			return NextResponse.redirect(url);
		}
	}

	console.log("Middleware passed, continuing request");
	return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
