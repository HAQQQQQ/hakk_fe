import React, { useRef, useState, useEffect } from "react";
import { Box, Button, Flex, VStack, Heading, chakra, Link, Text } from "@chakra-ui/react";
import * as faceapi from 'face-api.js';
import { supabase } from "../lib/supabase";  // adjust path as needed

const Video = chakra("video");

export default function VideoCapture() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [recording, setRecording] = useState(false);
    const [videoURL, setVideoURL] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const [uploadedPath, setUploadedPath] = useState<string | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [captions, setCaptions] = useState<string>("");
    const [transcriptLog, setTranscriptLog] = useState<string[]>([]);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [expressionsLog, setExpressionsLog] = useState<string[]>([]);

    // 1️⃣ Load face-api.js models and mark when ready
    useEffect(() => {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
        Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]).then(() => {
            console.log('FaceAPI models loaded');
            setModelsLoaded(true);
        }).catch(e => console.error('Model loading error:', e));
    }, []);

    // 2️⃣ Initialize webcam
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(mediaStream => {
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    videoRef.current.play().catch(() => {
                    });
                }
            }).catch(err => console.error('Error accessing webcam:', err));
        return () => stream?.getTracks().forEach(t => t.stop());
    }, []);

    // 3️⃣ Face detection + expression tracking loop with readiness checks
    useEffect(() => {
        if (!stream || !modelsLoaded) {
            console.log('Waiting for stream or models to load', { streamLoaded: !!stream, modelsLoaded });
            return;
        }
        let animationId: number;
        const detectLoop = async () => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (video && canvas && video.readyState >= 2) {
                try {
                    const detections = await faceapi
                        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                        .withFaceLandmarks()
                        .withFaceExpressions();
                    console.log('Detections', detections);
                    if (detections.length) {
                        const expressions = detections.map(det => {
                            const sorted = Object.entries(det.expressions).sort((a, b) => b[1] - a[1]);
                            return `${sorted[0][0]} (${(sorted[0][1] * 100).toFixed(0)}%)`;
                        });
                        console.log('Expressions', expressions);
                        setExpressionsLog(prev => [expressions.join(', '), ...prev]);
                    }
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        faceapi.draw.drawDetections(canvas, detections);
                        detections.forEach(({ detection, expressions }) => {
                            const { x, y } = detection.box;
                            const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
                            ctx.fillText(`${sorted[0][0]}`, x, y - 6);
                        });
                    }
                } catch (err) {
                    console.error('Detection error:', err);
                }
            }
            animationId = requestAnimationFrame(detectLoop);
        };
        detectLoop();
        return () => cancelAnimationFrame(animationId);
    }, [stream, modelsLoaded]);

    // 4️⃣ Live speech-to-text
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.onresult = (evt: any) => {
            let interim = '';
            for (let i = evt.resultIndex; i < evt.results.length; i++) {
                const transcript = evt.results[i][0].transcript;
                interim += transcript;
                if (evt.results[i].isFinal) {
                    setTranscriptLog(prev => [transcript, ...prev]);
                }
            }
            setCaptions(interim);
        };
        recog.start();
        return () => recog.stop();
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
            .from("video-logs")
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
                <Heading size="md" textAlign="center">Webcam AI Studio</Heading>

                <Box position="relative" borderRadius="lg" overflow="hidden" boxShadow="2xl" bg="black">
                    <Video ref={videoRef} autoPlay playsInline muted width="100%"/>
                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }}/>
                    <Text
                        position="absolute"
                        bottom="2"
                        left="50%"
                        transform="translateX(-50%)"
                        bg="blackAlpha.600"
                        color="white"
                        px={2}
                        borderRadius="md"
                        fontSize="sm"
                    >{captions}</Text>
                </Box>

                <Flex justify="center" gap={4}>
                    {!recording
                        ? <Button onClick={startRecording} colorScheme="red">Start Live Recording</Button>
                        : <Button onClick={stopRecording} colorScheme="gray">Stop Recording</Button>
                    }
                </Flex>

                {videoURL && (
                    <VStack gap={2} align="stretch">
                        <Heading size="sm">Recorded Video</Heading>
                        <Video src={videoURL} controls w="100%" borderRadius="md" boxShadow="lg"/>
                        <Flex gap={2}>
                            <Link href={videoURL} download="recording.webm">
                                <Button colorScheme="blue">Download</Button>
                            </Link>
                            <Button
                                onClick={uploadToSupabase}
                                colorScheme="green"
                                loading={uploading}
                                loadingText="Uploading…"
                            >Upload to Supabase</Button>
                        </Flex>
                        {uploadedPath && (
                            <Text fontSize="sm">Uploaded to: <Link
                                href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/video-logs/${uploadedPath}`}>{uploadedPath}</Link></Text>
                        )}
                    </VStack>
                )}

                {/* Logs */}
                <VStack align="stretch" gap={2}>
                    <Heading size="sm">Transcription Log</Heading>
                    {transcriptLog.map((line, i) => <Text key={i} fontSize="sm">{line}</Text>)}

                    <Heading size="sm">Expression Log</Heading>
                    {expressionsLog.map((exp, i) => <Text key={i} fontSize="sm">{exp}</Text>)}
                </VStack>
            </VStack>
        </Box>
    );
}
