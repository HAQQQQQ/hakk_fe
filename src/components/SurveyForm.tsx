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

	const chatContainerRef = useRef<HTMLDivElement>(null);

	// This function sends the chat message and processes the streaming response.
	// It accepts an onChunk callback that updates the UI as each delta arrives.
	const sendChatMessage = async (
		userMessage: string,
		onChunk: (chunk: string) => void
	) => {
		const response = await fetch("https://api.coze.com/v3/chat", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.NEXT_PUBLIC_COZE_API_KEY}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				bot_id: process.env.NEXT_PUBLIC_COZE_BOT_ID,
				user_id: process.env.NEXT_PUBLIC_COZE_USER_ID,
				stream: true,
				auto_save_history: true,
				additional_messages: [
					{
						role: "user",
						content: userMessage,
						content_type: "text",
						type: "question",
						name: "ram",
					}
				]
			})
		});

		if (!response.ok) {
			throw new Error("Network response was not ok");
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error("ReadableStream not supported in this environment");
		}

		const decoder = new TextDecoder();
		let buffer = "";
		let finalMessage = "";

		// Read the stream chunk by chunk.
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });

			// Split events by double newlines (SSE events are usually separated by \n\n)
			const events = buffer.split("\n\n");
			// Keep any incomplete event in the buffer.
			buffer = events.pop() || "";
			for (const eventStr of events) {
				const lines = eventStr.split("\n").map((line) => line.trim());
				let eventType = "";
				let dataStr = "";
				// Parse each line of the event.
				for (const line of lines) {
					if (line.startsWith("event:")) {
						eventType = line.replace("event:", "").trim();
					} else if (line.startsWith("data:")) {
						// In case data spans multiple lines.
						dataStr += line.replace("data:", "").trim();
					}
				}
				// Process delta events and accumulate message text.
				if (eventType === "conversation.message.delta") {
					try {
						const jsonData = JSON.parse(dataStr);
						if (jsonData.content) {
							finalMessage += jsonData.content;
							onChunk(finalMessage);
						}
					} catch (error) {
						console.error("Error parsing delta event:", error);
					}
				}
			}
		}
		return finalMessage;
	};

	// Setup mutation to call our streaming function.
	const mutation = useMutation({
		mutationFn: async (userMessage: string) => {
			// Reset state for new message.
			setBotTyping("");
			setIsTyping(true);
			return await sendChatMessage(userMessage, (chunk) => {
				// Update the displayed bot message as chunks arrive.
				setBotTyping(chunk);
			});
		},
		onSuccess: (finalMessage: string) => {
			// Append the final message to the chat and clear the typing state.
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "bot", text: finalMessage }
			]);
			setBotTyping("");
			setIsTyping(false);
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
		// Append the user's message to the chat.
		setMessages((prev) => [...prev, { sender: "user", text: input }]);
		mutation.mutate(input);
		setInput("");
	};

	// Auto-scroll to the bottom whenever messages or the live bot text update.
	useEffect(() => {
		if (chatContainerRef.current) {
			chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
		}
	}, [messages, botTyping]);

	// Styling for a sleek, futuristic look.
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
