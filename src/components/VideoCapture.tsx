import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, VStack, Heading, chakra, Link, Text } from "@chakra-ui/react";
import { supabase } from "../lib/supabase";  // adjust path as needed

const Video = chakra("video");

export default function VideoCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (videoRef.current) videoRef.current.srcObject = mediaStream;
            })
            .catch((err) => console.error("Error accessing webcam:", err));

        return () => {
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    const startRecording = () => {
        if (!stream) return;
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: "video/webm" });
            setVideoURL(URL.createObjectURL(blob));
        };

        recorder.start();
        setRecording(true);
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    };

    const uploadToSupabase = async () => {
        if (!chunksRef.current.length) return;
        setUploading(true);

        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const fileName = `recordings/${Date.now()}.webm`;

        const { data, error } = await supabase
            .storage
            .from("video-logs")      // ← your bucket name here
            .upload(fileName, blob, { cacheControl: "3600", upsert: false });

        setUploading(false);

        if (error) {
            console.error("Upload error:", error);
            return;
        }
        setUploadedPath(data.path);
    };

    return (
        <Box maxW="600px" mx="auto" py={6}>
            <VStack gap={4} align="stretch">
                <Heading size="md" textAlign="center">Webcam Video Capture</Heading>

                <Box borderRadius="lg" overflow="hidden" boxShadow="2xl" bg="black">
                    <Video ref={videoRef} autoPlay playsInline muted width="100%" />
                </Box>

                <Flex justify="center" gap={4}>
                    {!recording
                        ? <Button onClick={startRecording} colorScheme="red">Start Recording</Button>
                        : <Button onClick={stopRecording} colorScheme="gray">Stop Recording</Button>
                    }
                </Flex>

                {videoURL && (
                    <VStack gap={2} align="stretch">
                        <Heading size="sm">Recorded Video</Heading>
                        <Video src={videoURL} controls w="100%" borderRadius="md" boxShadow="lg" />
                        <Flex gap={2}>
                            <Link href={videoURL} download="recording.webm">
                                <Button colorScheme="blue">Download</Button>
                            </Link>
                            <Button
                                onClick={uploadToSupabase}
                                colorScheme="green"
                                loading={uploading}           // ← instead of `isLoading`
                                loadingText="Uploading…"      // ← optional companion text
                            >
                                Upload to Supabase
                            </Button>
                        </Flex>
                        {uploadedPath && (
                            <Text fontSize="sm">
                                Uploaded to:{" "}
                                <Link
                                    href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/video-logs/${uploadedPath}`}
                                >
                                    {uploadedPath}
                                </Link>
                            </Text>
                        )}
                    </VStack>
                )}
            </VStack>
        </Box>
    );
}
