// hooks/useProfile.ts
import { useEffect } from "react";
import { createClerkSupabaseClient } from "../lib/supabaseClient";

export function useProfile(user: any, session: any) {
	useEffect(() => {
		if (!user || !user.id) return;

		async function upsertProfile() {
			const supabaseClient = createClerkSupabaseClient(session);

			// Check if profile exists
			const { data: existingProfile, error: selectError } = await supabaseClient
				.from("profiles")
				.select("id")
				.eq("user_id", user.id);

			if (selectError) {
				console.error("Error checking for existing profile:", selectError);
				return;
			}

			const profileData = {
				email: user.primaryEmailAddress?.emailAddress,
				full_name: `${user.firstName} ${user.lastName}`,
				avatar_url: user.imageUrl,
				// role: user.publicMetaData.role, // PARTICIPANT OR COORDINATOR
			};

			if (existingProfile && existingProfile.length > 0) {
				const { data, error } = await supabaseClient
					.from("profiles")
					.update(profileData)
					.eq("user_id", user.id);

				if (error) {
					console.error("Error updating profile:", error);
				} else {
					console.log("Profile updated:", data);
				}
			} else {
				const { data, error } = await supabaseClient.from("profiles").insert({
					user_id: user.id,
					...profileData,
				});

				if (error) {
					console.error("Error creating profile:", error);
				} else {
					console.log("Profile created:", data);
				}
			}
		}

		upsertProfile();
	}, [user, session]);
}
