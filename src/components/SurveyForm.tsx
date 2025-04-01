"use client";

import { Box, Button, Container, Flex, Input, Text, VStack } from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

interface Message {
	sender: "bot" | "user";
	text: string;
}

export default function ChatBotDesktop() {
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [botTyping, setBotTyping] = useState("");

	// Ref for our typing animation interval and chat container (for auto-scrolling)
	const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	// Function to send the chat message to your API
	const sendChatMessage = async (userMessage: string) => {
		const response = await fetch("https://api.coze.com/v3/chat", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_API_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				bot_id: process.env.NEXT_PUBLIC_COZE_BOT_ID,
				user_id: process.env.NEXT_PUBLIC_COZE_USER_ID,
				stream: false,
				auto_save_history: true,
				additional_messages: [
					{
						role: "user",
						content: userMessage,
						content_type: "text"
					}
				]
			})
		});
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data = await response.json();
		// Adjust this according to your API's response structure.
		return data.message || "No response";
	};

	// Setup mutation with react-query
	const mutation = useMutation({
		mutationFn: async (userMessage: string) => {
			return await sendChatMessage(userMessage)
		},
		onSuccess: (botResponse: any) => {
			setIsTyping(true);
			setBotTyping("");
			let index = 0;
			typingIntervalRef.current = setInterval(() => {
				setBotTyping(() => {
					const newText = botResponse.slice(0, index + 1);
					index++;
					if (index === botResponse.length) {
						if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
						// Append the fully animated bot response to the conversation
						setMessages((prevMessages) => [
							...prevMessages,
							{ sender: "bot", text: newText }
						]);
						setBotTyping("");
						setIsTyping(false);
					}
					return newText;
				});
			}, 50);
		},
		onError: (error: any) => {
			console.error("Error sending chat message:", error);
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "bot", text: "Error: Unable to fetch response." }
			]);
			setIsTyping(false);
		}
	});

	const handleSend = () => {
		if (!input.trim()) return;

		// Append the user's message and trigger the API call
		setMessages((prev) => [...prev, { sender: "user", text: input }]);
		mutation.mutate(input);
		setInput("");
	};

	// Auto-scroll to the bottom whenever the messages or the animated bot text changes
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}
	}, [messages, botTyping]);

	// Styling for a sleek, futuristic, neutral look
	const containerBg = "black";
	const chatBg = "#1a1a1a";
	const botBubbleStyles = {
		alignSelf: "flex-start",
		bg: "#333",
		color: "white",
		p: 3,
		borderRadius: "lg",
		maxW: "80%",
		mb: 2,
		fontFamily: "monospace"
	};
	const userBubbleStyles = {
		alignSelf: "flex-end",
		bg: "white",
		color: "black",
		p: 3,
		borderRadius: "lg",
		maxW: "80%",
		mb: 2,
		fontFamily: "monospace"
	};

	return (
		<Container maxW="800px" py={8}>
			<Box
				bg={containerBg}
				borderRadius="lg"
				boxShadow="2xl"
				p={4}
				height="600px"
				display="flex"
				flexDirection="column"
			>
				<Box
					ref={chatContainerRef}
					flex="1"
					overflowY="auto"
					mb={4}
					px={2}
					bg={chatBg}
					borderRadius="md"
				>
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
				<Flex
					as="form"
					onSubmit={(e) => {
						e.preventDefault();
						handleSend();
					}}
				>
					<Input
						placeholder="Type your message..."
						value={input}
						onChange={(e) => setInput(e.target.value)}
						bg="white"
						color="black"
						fontSize="lg"
						height="48px"
						borderRadius="md"
						border="none"
						_focus={{ boxShadow: "outline" }}
					/>
					<Button type="submit" ml={2} colorScheme="gray" variant="outline">
						Send
					</Button>
				</Flex>
			</Box>
		</Container>
	);
}
