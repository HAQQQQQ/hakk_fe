import { Box, Button, Container, Flex, Image } from "@chakra-ui/react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { RiArrowRightLine } from "react-icons/ri";

export default function Header() {
	return (
		<Box as="header" bg="white" w="100%" boxShadow="lg" position="static">
			<Container maxW="container.lg">
				<Flex justify="space-between" align="center" py={4}>
					{/* Logo */}
					<Box>
						<Image src="/assets/logo.png" alt="HAKK Logo" h="60px" w="auto" />
					</Box>

					{/* Right Side Auth Buttons */}
					<Box>
						<SignedOut>
							<SignInButton mode="modal">
								<Button size="xl" rounded="xl" variant="outline">
									Get Started
									<RiArrowRightLine />
								</Button>
							</SignInButton>
						</SignedOut>
						<SignedIn>
							<UserButton />
						</SignedIn>
					</Box>
				</Flex>
			</Container>
		</Box>
	);
}
