import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, VStack, Heading, chakra, Link } from "@chakra-ui/react";

// Create a Chakra-enabled video element for proper prop support
const Video = chakra("video");

export default function VideoCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState("");
    const chunksRef = useRef<Blob[]>([]);

    // Request webcam access once on mount
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            })
            .catch((err) => console.error("Error accessing webcam:", err));

        return () => {
            // Stop tracks when component unmounts
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, []); // <-- empty deps ensures this runs only once

    const startRecording = () => {
        if (!stream) return;
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                chunksRef.current.push(event.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            setVideoURL(url);
        };

        recorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    return (
        <Box maxW="600px" mx="auto" py={6}>
            <VStack gap={4} align="stretch">
                <Heading size="md" textAlign="center">
                    Webcam Video Capture
                </Heading>

                {/* Live preview */}
                <Box borderRadius="lg" overflow="hidden" boxShadow="2xl" bg="black">
                    <Video ref={videoRef} autoPlay playsInline muted width="100%" />
                </Box>

                {/* Controls */}
                <Flex justify="center" gap={4}>
                    {!recording ? (
                        <Button onClick={startRecording} colorScheme="red">
                            Start Recording
                        </Button>
                    ) : (
                        <Button onClick={stopRecording} colorScheme="gray">
                            Stop Recording
                        </Button>
                    )}
                </Flex>

                {/* Playback & Download */}

                {videoURL && (
                    <VStack gap={2} align="stretch">
                        <Heading size="sm">Recorded Video</Heading>
                        <Video src={videoURL} controls w="100%" borderRadius="md" boxShadow="lg" />
                        <Link href={videoURL} download="recording.webm">
                            <Button colorScheme="blue">Download Recording</Button>
                        </Link>
                    </VStack>
                )}
            </VStack>
        </Box>
    );
}
