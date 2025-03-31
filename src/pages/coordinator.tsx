"use client";

import { useState } from "react";
import {
    Container,
    VStack,
    Box,
    Heading,
    Text,
    Badge,
    Flex,
} from "@chakra-ui/react";

export default function Coordinator() {
    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Summer Networking Gala",
            date: "2025-04-20",
            location: "NYC Rooftop Lounge",
            status: "Upcoming",
        },
        {
            id: 2,
            title: "Product Launch Summit",
            date: "2025-03-15",
            location: "Chicago Tech Hub",
            status: "Completed",
        },
    ]);

    return (
        <Container maxW="6xl" py={10}>
            <VStack align="stretch" spacing={6}>
                <Heading size="6xl" textAlign="center" color="white.800" mb={4}>
                    📅 Event Portal
                </Heading>

                {events.map((event) => (
                    <Box
                        key={event.id}
                        bg="white"
                        p={6}
                        borderRadius="2xl"
                        boxShadow="md"
                        _hover={{ boxShadow: "lg" }}
                    >
                        <Heading size="md" color="teal.600" mb={2}>
                            {event.title}
                        </Heading>

                        <Flex direction="column" gap={1}>
                            <Text color="gray.700">
                                <strong>Date:</strong> {event.date}
                            </Text>
                            <Text color="gray.700">
                                <strong>Location:</strong> {event.location}
                            </Text>
                            <Badge
                                mt={2}
                                variant="solid"
                                colorScheme={event.status === "Upcoming" ? "green" : "gray"}
                                alignSelf="flex-start"
                                fontSize="0.9em"
                                px={3}
                                py={1}
                                borderRadius="full"
                            >
                                {event.status}
                            </Badge>
                        </Flex>
                    </Box>
                ))}
            </VStack>
        </Container>
    );
}
