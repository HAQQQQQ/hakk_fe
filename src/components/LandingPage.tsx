"use client";

import React from "react";
import { motion } from "framer-motion";
import { Box, Heading, Image } from "@chakra-ui/react";

// Chakra + Motion component
const MotionHeading = motion(Heading);
const MotionImage = motion(Image);
const MotionBox = motion(Box);

const commonHeadingStyle = {
	textAlign: "center" as const,
	fontWeight: "bold",
	size: "6xl",
} as const;

const LandingPage = () => {
	return (
		<Box
			as="section"
			className="landing-page"
			position="relative"
			minH="100vh"
			pt="4rem"
			overflow="hidden"
		>
			{/* Main Heading */}
			<MotionHeading
				as="h1"
				{...commonHeadingStyle}
				initial={{ opacity: 0.2, y: 550 }}
				animate={{ opacity: 1, y: 650 }}
				transition={{ duration: 3 }}
			>
				Speed dating optimized.
			</MotionHeading>

			<MotionBox
				display="flex"
				justifyContent="center"
				overflow="hidden"
				mb="1rem"
				position="relative"
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.8, ease: "easeOut" }}
			>
				{/* Left Image */}
				<MotionImage
					src="/assets/speeddating1.jpg"
					alt="Banner Left"
					objectFit="cover"
					w="50%"
					initial={{ x: "-100%", scale: 0.8 }}
					animate={{ x: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>

				{/* Right Image */}
				<MotionImage
					src="/assets/speeddating2.jpg"
					alt="Banner Right"
					objectFit="cover"
					w="50%"
					initial={{ x: "100%", scale: 0.8 }}
					animate={{ x: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>
			</MotionBox>

			{/* Secondary Message - fixed near bottom of viewport */}
			<MotionHeading
				as="h1"
				{...commonHeadingStyle}
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 1, delay: 0.3 }}
			>
				Matching has never been easier.
			</MotionHeading>
		</Box>
	);
};

export default LandingPage;
