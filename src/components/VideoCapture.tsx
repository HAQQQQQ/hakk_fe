import React, { useRef, useState, useEffect } from "react";
import {
    Box,
    Button,
    Flex,
    VStack,
    Heading,
    chakra,
    Link,
    Text,
} from "@chakra-ui/react";
import * as faceapi from "face-api.js";
import { supabase } from "../lib/supabase";

const Video = chakra("video");

export default function VideoCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);

    const [captions, setCaptions] = useState("");
    const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
    const [faceLog, setFaceLog] = useState<string[]>([]);

    // ─── 1️⃣ Load ALL advanced face-api.js models ─────────────────────────────────
    useEffect(() => {
        const MODEL_URL =
            "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
        Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.mtcnn.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        ])
            .then(() => {
                console.log("✅ Advanced FaceAPI models loaded");
                setModelsLoaded(true);
            })
            .catch((e) => console.error("❌ Model loading error:", e));
    }, []);

    // ─── 2️⃣ Init webcam ─────────────────────────────────────────────────────────
    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(() => {});
                }
            })
            .catch((err) => console.error("Error accessing webcam:", err));
        return () => stream?.getTracks().forEach((t) => t.stop());
    }, []);

    // ─── 3️⃣ Detection loop: MTCNN → landmarks → expressions → age/gender → descriptor ─────────────────
    useEffect(() => {
        if (!stream || !modelsLoaded) return;

        let animationId: number;
        const mtcnnOptions = new faceapi.MtcnnOptions({
            minFaceSize: 100,
            scaleFactor: 0.709,
        });

        const detectLoop = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState >= 2) {
                try {
                    const results = await faceapi
                        .detectAllFaces(video, mtcnnOptions)
                        .withFaceLandmarks()
                        .withFaceExpressions()
                        .withAgeAndGender()
                        .withFaceDescriptors();

                    // draw
                    const ctx = canvas.getContext("2d")!;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, results);
                    faceapi.draw.drawFaceLandmarks(canvas, results);

                    // log each face’s top attributes
                    const newEntries = results.map((r) => {
                        // top expression
                        const topExpr = Object.entries(r.expressions)
                            .sort((a, b) => b[1] - a[1])[0];
                        // age, gender
                        const age = Math.round(r.age);
                        const gender = r.gender;
                        // take first 6 chars of descriptor’s hex for a short ID
                        const idHex = Array.from(r.descriptor.slice(0, 6))
                            .map((n) => n.toString(16).padStart(2, "0"))
                            .join("");

                        return `${topExpr[0]}(${(topExpr[1] * 100).toFixed(
                            0
                        )}%) • ${gender} • ${age}yrs • id:${idHex}`;
                    });

                    if (newEntries.length) {
                        setFaceLog((f) => [...newEntries, ...f].slice(0, 50)); // keep last 50
                    }
                } catch (err) {
                    console.error("Detection error:", err);
                }
            }
            animationId = requestAnimationFrame(detectLoop);
        };

        detectLoop();
        return () => cancelAnimationFrame(animationId);
    }, [stream, modelsLoaded]);

    // ─── 4️⃣ Speech-to-text ───────────────────────────────────────────────────────
    useEffect(() => {
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.onresult = (evt: any) => {
            let interim = "";
            for (let i = evt.resultIndex; i < evt.results.length; i++) {
                const txt = evt.results[i][0].transcript;
                interim += txt;
                if (evt.results[i].isFinal) {
                    setTranscriptLog((t) => [txt, ...t].slice(0, 50));
                }
            }
            setCaptions(interim);
        };
        recog.start();
        return () => recog.stop();
    }, []);

    // ─── Recording & Supabase upload (unchanged) ────────────────────────────────
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
        const { data, error } = await supabase.storage
            .from("video-logs")
            .upload(fileName, blob, { cacheControl: "3600", upsert: false });
        setUploading(false);
        if (error) return console.error("Upload error:", error);
        setUploadedPath(data.path);
    };

    return (
        <Box px={6} py={4}>
            <Heading size="lg" textAlign="center" mb={4}>
                Webcam AI Studio
            </Heading>

            <Flex align="start" gap={8}>
                {/* ─── Left Column: Video & Recording ────────────────────────────── */}
                <Box flex="2">
                    <VStack gap={4} align="stretch">
                        <Box position="relative" borderRadius="lg" overflow="hidden" bg="black">
                            <Video ref={videoRef} autoPlay playsInline muted w="100%" />
                            <canvas
                                ref={canvasRef}
                                style={{ position: "absolute", top: 0, left: 0 }}
                            />
                            <Text
                                pos="absolute"
                                bottom="2"
                                left="50%"
                                transform="translateX(-50%)"
                                bg="blackAlpha.600"
                                color="white"
                                px={2}
                                borderRadius="md"
                                fontSize="sm"
                            >
                                {captions}
                            </Text>
                        </Box>

                        <Flex justify="center">
                            {!recording ? (
                                <Button onClick={startRecording} colorScheme="red">
                                    Start Live Recording
                                </Button>
                            ) : (
                                <Button onClick={stopRecording} colorScheme="gray">
                                    Stop Recording
                                </Button>
                            )}
                        </Flex>

                        {videoURL && (
                            <VStack gap={2} align="stretch">
                                <Heading size="sm">Recorded Video</Heading>
                                <Video src={videoURL} controls w="100%" borderRadius="md" />
                                <Flex gap={2}>
                                    <Link href={videoURL} download="recording.webm">
                                        <Button colorScheme="blue">Download</Button>
                                    </Link>
                                    <Button
                                        onClick={uploadToSupabase}
                                        colorScheme="green"
                                        loading={uploading}
                                        loadingText="Uploading…"
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

                {/* ─── Right Column: Logs ────────────────────────────────────────── */}
                <Box flex="1" maxH="80vh" overflowY="auto">
                    <VStack align="stretch" gap={4}>
                        <Heading size="sm">Transcription Log</Heading>
                        {transcriptLog.map((line, i) => (
                            <Text key={i} fontSize="sm">
                                {line}
                            </Text>
                        ))}

                        <Heading size="sm" pt={4}>
                            Face Analysis Log
                        </Heading>
                        {faceLog.map((entry, i) => (
                            <Text key={i} fontSize="sm">
                                {entry}
                            </Text>
                        ))}
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
}
