import { SignedIn, useSession, useUser } from "@clerk/nextjs";
import WelcomeMessage from "@/components/WelcomeMessage";
import { useProfile } from "@/hooks/useProfile";
import VideoCapture from "@/components/VideoCapture";

export default function ParticipantPage() {
    const { session } = useSession();
    const { user } = useUser();

    useProfile(user, session);

    return (
        <SignedIn>
            <WelcomeMessage user={user} />
                <VideoCapture></VideoCapture>
        </SignedIn>
    );
}
