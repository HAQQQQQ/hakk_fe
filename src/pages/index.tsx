import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import LandingPage from "../components/LandingPage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const { user } = useUser();
	const router = useRouter();

	useEffect(() => {
		if (user?.publicMetadata?.role === "participant") {
			router.push("/participant");
		} else if (user?.publicMetadata?.role === "coordinator") {
			router.push("/coordinator");
		}
	}, [user, router]);


	return (
		<div>
			<main>
				<SignedOut>
					<LandingPage />
				</SignedOut>
				{/* You can even show a loader or splash screen briefly while redirecting */}
				<SignedIn>
					<p>Redirecting...</p>
				</SignedIn>
			</main>
		</div>
	);
}
