'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
    Box,
    Button,
    Heading,
    Text,
    Portal,
    Select,
    createListCollection,
} from '@chakra-ui/react';

const roleCollection = createListCollection({
    items: [
        { label: 'Participant', value: 'participant' },
        { label: 'Coordinator', value: 'coordinator' },
    ],
});

export default function SelectRolePage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [role, setRole] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const setRoleStub = (role: string) => {
        console.log(role);
        setRole(role);
    }


    useEffect(() => {
        if (!isLoaded) return;
        const hasRole = user?.publicMetadata?.role;
        if (hasRole) router.replace('/');
    }, [isLoaded, user, router]);

    const handleSubmit = async () => {
        if (!role) return;
        setSubmitting(true);

        const res = await fetch('/api/set-user-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
        });

        if (res.ok) {
            router.push(role === 'coordinator' ? '/coordinator' : '/participant');
        } else {
            console.error('Failed to set user metadata');
        }
    };

    return (
        <Box maxW="3xl" mx="auto" mt="20" p="4" borderWidth="1px" borderRadius="md" shadow="md">
            <Heading as="h1" size="lg" textAlign="center" mb="6">
                Select Role
            </Heading>

            <Box mb="4">
                <Text mb="2" fontWeight="medium">Role</Text>
                <Select.Root
                    collection={roleCollection}
                    onValueChange={(val) => setRoleStub(String(val.value))}
                    size="lg"
                    width="100%"
                >
                    <Select.HiddenSelect />
                    <Select.Control>
                        <Select.Trigger>
                            <Select.ValueText placeholder="Select role" />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                            <Select.Indicator />
                        </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                        <Select.Positioner>
                            <Select.Content
                                bg="black"
                                color="white"
                                border="1px solid"
                                borderColor="gray.600"
                                borderRadius="md"
                                shadow="md"
                            >
                                {roleCollection.items.map((item) => (
                                    <Select.Item
                                        key={item.value}
                                        item={item}
                                        _hover={{ bg: 'gray.700' }}
                                        _selected={{ bg: 'gray.800', fontWeight: 'bold' }}
                                    >
                                        {item.label}
                                        <Select.ItemIndicator />
                                    </Select.Item>
                                ))}
                            </Select.Content>
                        </Select.Positioner>
                    </Portal>
                </Select.Root>
            </Box>

            <Button
                colorScheme="blue"
                width="full"
                onClick={handleSubmit}
                loadingText="Saving..."
            >
                Continue
            </Button>
        </Box>
    );
}
