import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import LandingPage from "../components/LandingPage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flex, Spinner } from "@chakra-ui/react";

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
				<SignedIn>
					<Flex align="center" justify="center" height="100vh">
						<Spinner size="xl" color="teal.500" />
					</Flex>
				</SignedIn>
			</main>
		</div>
	);
}
