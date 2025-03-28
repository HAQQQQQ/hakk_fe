import { SignedIn, SignedOut, useSession, useUser } from "@clerk/nextjs";
import SurveyForm from "../components/SurveyForm";
import { useProfile } from "../hooks/useProfile";
import WelcomeMessage from "../components/WelcomeMessage";
import LandingPage from "../components/LandingPage";

export default function Home() {
	// Get Clerk session and user details
	const { session } = useSession();
	const { user } = useUser();

	// Use the custom hook to upsert the profile
	useProfile(user, session);

	return (
		<div>
			<main>
				<SignedIn>
					<WelcomeMessage user={user}></WelcomeMessage>
					<SurveyForm />
				</SignedIn>
				{/* Hero Section */}
				<SignedOut>
					<LandingPage></LandingPage>
				</SignedOut>
			</main>
		</div>
	);
}
