"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Container,
    VStack,
    Box,
    Heading,
    Text,
    Badge,
    Flex,
    Spinner,
} from "@chakra-ui/react";

type Event = {
    id: number;
    title: string;
    date: string;
    location: string;
    status: "Upcoming" | "Completed";
};

export default function Coordinator() {
    const fetchEvents = (): Promise<Event[]> =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve([
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
            }, 1000);
        });

    const { data: events, isLoading, error } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: fetchEvents,
    });

    return (
        <Container maxW="6xl" py={10}>
            <VStack align="stretch">
                <Heading size="4xl" textAlign="center" color="gray.800" mb={4}>
                    📅 Event Portal
                </Heading>

                {isLoading && (
                    <Flex justify="center">
                        <Spinner size="xl" color="teal.500" />
                    </Flex>
                )}

                {error && (
                    <Text color="red.500" textAlign="center">
                        Failed to load events.
                    </Text>
                )}

                {events &&
                    events.map((event) => (
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
                                    colorScheme={
                                        event.status === "Upcoming" ? "green" : "gray"
                                    }
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
