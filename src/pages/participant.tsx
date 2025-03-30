import { SignedIn, useSession, useUser } from "@clerk/nextjs";
import WelcomeMessage from "@/components/WelcomeMessage";
import SurveyForm from "@/components/SurveyForm";
import { useProfile } from "@/hooks/useProfile";

export default function ParticipantPage() {
    const { session } = useSession();
    const { user } = useUser();

    useProfile(user, session);

    return (
        <SignedIn>
            <WelcomeMessage user={user} />
            <SurveyForm />
        </SignedIn>
    );
}
