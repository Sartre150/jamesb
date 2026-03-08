"use client";

import { useState, useRef, useEffect } from "react";

export default function SpyGadget() {
  const[isMissionActive, setIsMissionActive] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const[isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLockRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const touchStartRef = useRef({ x: 0, y: 0 });

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (err) {
      console.error("WakeLock falló");
    }
  };

  const startMission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, 
        audio: true, 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      await requestWakeLock();
      setIsMissionActive(true);
      setShowVideo(false);
    } catch (error) {
      alert("Permisos denegados.");
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) downloadFile(blob, `foto_${Date.now()}.jpg`);
      }, "image/jpeg", 0.9);
    }
  };

  const toggleVideoRecording = () => {
    if (isRecordingVideo) {
      mediaRecorderRef.current?.stop();
      setIsRecordingVideo(false);
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

      const recorder = new MediaRecorder(stream);
      chunksRef.current =[];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/mp4" });
        downloadFile(blob, `video_${Date.now()}.mp4`);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
    }
  };

  const toggleAudioRecording = () => {
    if (isRecordingAudio) {
      audioRecorderRef.current?.stop();
      setIsRecordingAudio(false);
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

      const audioTrack = stream.getAudioTracks()[0];
      const audioStream = new MediaStream([audioTrack]);

      const recorder = new MediaRecorder(audioStream);
      audioChunksRef.current =[];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/mp4" });
        downloadFile(blob, `audio_${Date.now()}.m4a`);
      };

      recorder.start();
      audioRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    }
  };

  const endMission = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
    }
    setIsMissionActive(false);
    setIsRecordingVideo(false);
    setIsRecordingAudio(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMissionActive) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - touchStartRef.current.x;
    const diffY = endY - touchStartRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX > 40) toggleVideoRecording();
      else if (diffX < -40) toggleAudioRecording();
    } else {
      if (diffY > 40) takePhoto();
      else if (diffY < -40) endMission();
    }
  };

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center bg-black transition-all duration-500 select-none"
    >
      {!isMissionActive ? (
        <button
          onClick={startMission}
          className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl transition-all hover:bg-zinc-800 focus:outline-none active:scale-95"
        >
          INICIAR CALCULO
        </button>
      ) : (
        <div 
          className="relative w-full h-screen bg-black flex items-center justify-center overflow-hidden"
          onDoubleClick={() => setShowVideo(!showVideo)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas ref={canvasRef} className="hidden" />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
              showVideo ? "opacity-30" : "opacity-0"
            }`}
          />

          <div className="absolute top-4 left-4 flex gap-2 opacity-50">
            {isRecordingVideo && <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />}
            {isRecordingAudio && <div className="w-2 h-2 rounded-full bg-[#0a1a2a]" />}
          </div>
        </div>
      )}
    </main>
  );
}