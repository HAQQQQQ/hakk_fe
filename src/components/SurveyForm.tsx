"use client";

import { Box, Button, Container, Flex, Input, Text, VStack } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useColorModeValue } from "@/components/ui/color-mode";

interface Message {
	sender: "bot" | "user";
	text: string;
}

const randomResponses = [
	"That's fascinating!",
	"I never knew that.",
	"Tell me more.",
	"Really interesting perspective.",
	"Wow, that's cool!",
	"Hmm, intriguing.",
	"Oh, I see."
];

export default function ChatBotDesktop() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [botTyping, setBotTyping] = useState("");

	// Type the interval reference appropriately
	const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Type the chat container reference to HTMLDivElement
	const chatContainerRef = useRef<HTMLDivElement>(null);

	const handleSend = () => {
		if (!input.trim()) return;

		// Append user's message
		setMessages((prev: Message[]) => [...prev, { sender: "user", text: input }]);
		setInput("");

		// Simulate API call delay and typing animation
		setIsTyping(true);
		setTimeout(() => {
			const response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
			let index = 0;
			setBotTyping("");

			typingIntervalRef.current = setInterval(() => {
				setBotTyping((prev) => {
					const newText = response.slice(0, index + 1);
					index++;
					if (index === response.length) {
						if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
						// Append the completed bot message to the conversation
						setMessages((prevMessages: Message[]) => [...prevMessages, { sender: "bot", text: newText }]);
						setBotTyping("");
						setIsTyping(false);
					}
					return newText;
				});
			}, 50);
		}, 1000);
	};

	// Auto-scroll to the bottom when new messages or typing animation updates occur
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}
	}, [messages, botTyping]);

	const botBubbleStyles = {
		alignSelf: "flex-start",
		bg: useColorModeValue("gray.300", "gray.600"),
		color: useColorModeValue("black", "white"),
		p: 3,
		borderRadius: "md",
		maxW: "80%",
		mb: 2,
	};

	const userBubbleStyles = {
		alignSelf: "flex-end",
		bg: useColorModeValue("gray.600", "gray.800"),
		color: "white",
		p: 3,
		borderRadius: "md",
		maxW: "80%",
		mb: 2,
	};

	return (
		<Container maxW="800px" py={8}>
			<Box
				bg={useColorModeValue("gray.50", "gray.900")}
				borderRadius="lg"
				boxShadow="lg"
				p={4}
				height="600px"
				display="flex"
				flexDirection="column"
			>
				<Box ref={chatContainerRef} flex="1" overflowY="auto" mb={4} px={2}>
					<VStack align="stretch">
						{messages.map((msg, i) => (
							<Box key={i} {...(msg.sender === "bot" ? botBubbleStyles : userBubbleStyles)}>
								<Text>{msg.text}</Text>
							</Box>
						))}
						{isTyping && (
							<Box {...botBubbleStyles}>
								<Text>{botTyping || "..."}</Text>
							</Box>
						)}
					</VStack>
				</Box>
				<Flex as="form" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
					<Input
						placeholder="Type your message..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						bg="white"
						color="black"
						fontSize="lg"
						height="48px"
					/>
					<Button type="submit" ml={2} colorScheme="gray">
						Send
					</Button>
				</Flex>
			</Box>
		</Container>
	);
}
