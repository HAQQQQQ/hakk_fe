"use client";

import {
	Box,
	Button,
	Container,
	Heading,
	Input,
	Text,
	VStack,
	useBreakpointValue,
} from "@chakra-ui/react";
import "react-toastify/dist/ReactToastify.css";
import { useState } from "react";
import { useColorModeValue } from "./ui/color-mode";

const categories = ["movies", "artists", "hobbies"] as const;

export default function ChatSurvey() {
	const [step, setStep] = useState(0);
	const [formData, setFormData] = useState<Record<string, string[]>>({
		movies: [],
		artists: [],
		hobbies: [],
	});
	const [currentInput, setCurrentInput] = useState("");

	const currentCategory = categories[Math.floor(step / 3)];
	const isFinalStep = step >= categories.length * 3;

	const bgColor = useColorModeValue("gray.100", "white.900");
	const chatBubbleBg = useColorModeValue("gray.100", "white.700");
	const accentColor = "black.800";

	const promptFontSize = useBreakpointValue({ base: "xl", md: "2xl" });

	const handleNext = () => {
		if (!currentInput.trim()) return;

		const category = currentCategory;
		setFormData((prev) => ({
			...prev,
			[category]: [...prev[category], currentInput],
		}));

		setCurrentInput("");
		setStep(step + 1);
	};

	const handleSubmit = () => {
		console.log("Submitting:", formData);
	};

	return (
		<Container maxW="6xl" py={10}>
			<VStack align="stretch" p={8} bg={bgColor} borderRadius="2xl" boxShadow="lg">
				<Heading size="3xl" textAlign="center" color="black" letterSpacing="wide">
					🎤 Let’s get to know you!
				</Heading>

				{!isFinalStep && (
					<>
						<Box
							bg={chatBubbleBg}
							borderRadius="lg"
							p={5}
							boxShadow="sm"
							borderLeft="6px solid"
							borderColor={accentColor}
							display="flex"
							alignItems="center"
						>
							<Text fontSize={promptFontSize} fontWeight="semibold" color="gray.700">
								{`What's one of your favorite ${currentCategory}?`}
							</Text>
							<Text fontSize="sm" color="gray.500" ml={2}>
								({formData[currentCategory].length + 1}/3)
							</Text>
						</Box>

						<Input
							placeholder={`Type a ${currentCategory.slice(0, -1)}...`}
							value={currentInput}
							onChange={(e) => setCurrentInput(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleNext()}
							size="lg"
							bg="white"
							borderRadius="full"
							boxShadow="sm"
							px={6}
							py={5}
						/>

						<Button
							variant="ghost"
							onClick={handleNext}
							colorScheme="teal"
							size="2xl"
							borderRadius="full"
							px={8}
							fontWeight="bold"
						>
							Next →
						</Button>
					</>
				)}

				{isFinalStep && (
					<>
						<Box
							bg={chatBubbleBg}
							borderRadius="lg"
							p={6}
							boxShadow="sm"
							borderLeft="6px solid"
							borderColor={accentColor}
						>
							<Text fontSize="2xl" fontWeight="bold" mb={2}>
								🎉 Youre all done!
							</Text>
							<Text fontSize="md" mb={4}>
								Here’s what you picked:
							</Text>

							{categories.map((cat) => (
								<Box key={cat} mb={2}>
									<Text fontWeight="semibold" color="black.600">
										{cat.charAt(0).toUpperCase() + cat.slice(1)}:
									</Text>
									<Text color="gray.700">{formData[cat].join(", ")}</Text>
								</Box>
							))}
						</Box>

						<Button
							colorScheme="green"
							size="lg"
							borderRadius="full"
							px={8}
							fontWeight="bold"
							onClick={handleSubmit}
						>
							✅ Submit Preferences
						</Button>
					</>
				)}
			</VStack>
		</Container>
	);
}
