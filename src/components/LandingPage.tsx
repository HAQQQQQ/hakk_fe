"use client";

import React from "react";
import { motion } from "framer-motion";
import { Box, Heading, Image, useBreakpointValue } from "@chakra-ui/react";

// Chakra + Motion component
const MotionHeading = motion(Heading);
const MotionImage = motion(Image);
const MotionBox = motion(Box);

const commonHeadingStyle = {
	textAlign: "center" as const,
	fontWeight: "bold",
	fontSize: { base: "3xl", md: "5xl", lg: "6xl" },
} as const;

const LandingPage = () => {
	const headingY = useBreakpointValue({ base: -100, md: 0 });
	const headingYOffset = useBreakpointValue({ base: 100, md: 100 });
	console.log(headingY, headingYOffset);

	return (
		<Box
			as="section"
			className="landing-page"
			position="relative"
			minH="100vh"
			pt={{ base: "2rem", md: "4rem" }}
		>
			<MotionBox
				display={{ base: "block", md: "flex" }}
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
					src="/assets/tradingimage1.jpg"
					alt="Banner Left"
					objectFit="cover"
					w={{ base: "100%", md: "50%" }}
					initial={{ x: "-100%", scale: 0.8 }}
					animate={{ x: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>

				{/* Right Image */}
				<MotionImage
					src="/assets/tradingimage2.jpg"
					alt="Banner Right"
					objectFit="cover"
					w={{ base: "100%", md: "50%" }}
					initial={{ x: "100%", scale: 0.8 }}
					animate={{ x: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: "easeOut" }}
				/>
			</MotionBox>

			{/* Main Heading */}
			<MotionHeading
				as="h1"
				{...commonHeadingStyle}
				initial={{ opacity: 0.2, y: headingY }}
				animate={{ opacity: 1, y: (headingY ?? 0) + (headingYOffset ?? 0)}}
				transition={{ duration: 3 }}
				viewport={{ once: true }}
			>
				Trade logs made passive.
			</MotionHeading>
			{/* Secondary Message - fixed near bottom of viewport */}
			<MotionHeading
				as="h1"
				{...commonHeadingStyle}
				initial={{ opacity: 0.2, y: headingY }}
				animate={{ opacity: 1, y: (headingY ?? 0) + (headingYOffset ?? 0) + 30}}
				transition={{ duration: 1, delay: 0.3 }}
				viewport={{ once: true }}
			>
				Log your trades like never before.
			</MotionHeading>
		</Box>
	);
};

export default LandingPage;
