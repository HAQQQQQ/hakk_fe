import { motion } from "framer-motion";
import { Box, Heading } from "@chakra-ui/react";

// Create motion-enhanced Chakra UI components
const MotionHeading = motion(Heading);

export default function WelcomeMessage({ user }) {
	return (
		<Box pt="2rem" mb="2rem" textAlign="center" color="white">
			<MotionHeading
				initial={{ x: -100, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut" }}
				fontSize="2.5rem"
				fontWeight="700"
				mb="0.5rem"
				letterSpacing="-0.5px"
			>
				Welcome, {user?.firstName} {user?.lastName}!
			</MotionHeading>

			<MotionHeading
				initial={{ x: 100, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
				fontSize="1rem"
				fontWeight="700"
				mb="0.5rem"
				letterSpacing="-0.5px"
			>
				Please talk to me to proceed.
			</MotionHeading>
		</Box>
	);
}
