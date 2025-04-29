import React, { useRef, useState, useEffect, useCallback } from "react";
import {
    Box,
    Button,
    Flex,
    VStack,
    Heading,
    chakra,
    Text,
} from "@chakra-ui/react";
import * as faceapi from "face-api.js";
import { supabase } from "../lib/supabase";

const Video = chakra("video");

export default function VideoCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [recording, setRecording] = useState(false);

    // session ID for chunked uploads
    const sessionIdRef = useRef<string>(`sess_${Date.now()}`);

    const [captions, setCaptions] = useState("");
    const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
    const [faceLog, setFaceLog] = useState<string[]>([]);

    // ─── Load face-api.js models ─────────────────────────────────────────────────
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
                console.log("✅ FaceAPI models loaded");
                setModelsLoaded(true);
            })
            .catch((e) => console.error("Model loading error:", e));
    }, []);

    // ─── Init webcam ─────────────────────────────────────────────────────────────
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
            .catch((err) => console.error("Webcam access error:", err));
        return () => stream?.getTracks().forEach((t) => t.stop());
    }, []);

    // ─── Detection loop ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!stream || !modelsLoaded) return;

        let animationId: number;
        const mtcnnOptions = new faceapi.MtcnnOptions({ minFaceSize: 100, scaleFactor: 0.709 });

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

                    const ctx = canvas.getContext("2d")!;
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, results);
                    faceapi.draw.drawFaceLandmarks(canvas, results);

                    const newEntries = results.map((r) => {
                        const topExpr = Object.entries(r.expressions).sort((a, b) => b[1] - a[1])[0];
                        return `${topExpr[0]}(${(topExpr[1] * 100).toFixed(0)}%) • ${r.gender} • ${Math.round(r.age)}yrs • id:${Array.from(r.descriptor.slice(0,6)).map(n => n.toString(16).padStart(2,'0')).join('')}`;
                    });

                    if (newEntries.length) setFaceLog((f) => [...newEntries, ...f].slice(0,50));
                } catch (err) {
                    console.error("Detection error:", err);
                }
            }
            animationId = requestAnimationFrame(detectLoop);
        };

        detectLoop();
        return () => cancelAnimationFrame(animationId);
    }, [stream, modelsLoaded]);

    // ─── Speech-to-text ──────────────────────────────────────────────────────────
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
                interim += evt.results[i][0].transcript;
                if (evt.results[i].isFinal) setTranscriptLog((t) => [evt.results[i][0].transcript, ...t].slice(0,50));
            }
            setCaptions(interim);
        };
        recog.start();
        return () => recog.stop();
    }, []);

    // ─── Recording & chunked upload ──────────────────────────────────────────────
    const startRecording = useCallback(() => {
        console.log(`Session ID: ${sessionIdRef.current}`);
        if (!stream) return;

        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        mediaRecorderRef.current = recorder;
        let chunkIndex = 0;

        recorder.ondataavailable = async (e: BlobEvent) => {
            if (e.data.size === 0) {
                console.log("Empty chunk, skipping.");
                return;
            }
            const chunkName = `${sessionIdRef.current}/chunk_${chunkIndex}.webm`;
            console.log(`Uploading chunk #${chunkIndex}: ${chunkName}`);
            const { error } = await supabase.storage
                .from("video-logs")
                .upload(chunkName, e.data, { cacheControl: "3600", upsert: false });
            if (error) console.error(`❌ Chunk #${chunkIndex} upload failed:`, error);
            else console.log(`✅ Chunk #${chunkIndex} uploaded.`);
            chunkIndex++;
        };

        // automatically emit blobs every 5s
        recorder.start(5000);
        setRecording(true);
    }, [stream]);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
        setRecording(false);
    }, []);

    return (
        <Box px={6} py={4}>
            <Heading size="lg" textAlign="center" mb={4}>Webcam AI Studio</Heading>
            <Flex align="start" gap={8}>
                <Box flex="2">
                    <VStack gap={4} align="stretch">
                        <Box position="relative" borderRadius="lg" overflow="hidden" bg="black">
                            <Video ref={videoRef} autoPlay playsInline muted w="100%" />
                            <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0 }} />
                            <Text pos="absolute" bottom="2" left="50%" transform="translateX(-50%)" bg="blackAlpha.600" color="white" px={2} borderRadius="md" fontSize="sm">{captions}</Text>
                        </Box>
                        <Flex justify="center">
                            <Button onClick={startRecording} colorScheme="red" disabled={recording} mr={2}>Start Live Recording</Button>
                            <Button onClick={stopRecording} colorScheme="gray" disabled={!recording}>Stop Recording</Button>
                        </Flex>
                    </VStack>
                </Box>
                <Box flex="1" maxH="80vh" overflowY="auto">
                    <VStack align="stretch" gap={4}>
                        <Heading size="sm">Transcription Log</Heading>
                        {transcriptLog.map((line,i) => <Text key={i} fontSize="sm">{line}</Text>)}
                        <Heading size="sm" pt={4}>Face Analysis Log</Heading>
                        {faceLog.map((entry,i) => <Text key={i} fontSize="sm">{entry}</Text>)}
                    </VStack>
                </Box>
            </Flex>
        </Box>
    );
}
