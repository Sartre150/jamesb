"use client";

import { useState, useRef } from "react";

export default function KGBDevice() {
  const[isMissionActive, setIsMissionActive] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [vault, setVault] = useState<File[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLockRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch (err) {}
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
      alert("Comando: Acceso denegado al hardware.");
    }
  };

  const executePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `dt_${Date.now()}.jpg`, { type: "image/jpeg" });
          setVault(prev => [...prev, file]);
        }
      }, "image/jpeg", 0.9);
    }
    setShowVideo(true);
    setTimeout(() => setShowVideo(false), 150);
  };

  const executeVideo = () => {
    if (isRecordingVideo) {
      mediaRecorderRef.current?.stop();
      setIsRecordingVideo(false);
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

      const recorder = new MediaRecorder(stream);
      chunksRef.current =[];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: mime });
        const file = new File([blob], `dt_${Date.now()}.mp4`, { type: mime });
        setVault(prev => [...prev, file]);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecordingVideo(true);
    }
  };

  const executeAudio = () => {
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
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/mp4';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const file = new File([blob], `dt_${Date.now()}.m4a`, { type: mime });
        setVault(prev => [...prev, file]);
      };

      recorder.start();
      audioRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    }
  };

  const exportVault = async () => {
    if (vault.length === 0) return;

    try {
      if (navigator.canShare && navigator.canShare({ files: vault })) {
        await navigator.share({
          files: vault,
          title: 'Docs',
        });
      } else {
        vault.forEach(file => {
          const url = URL.createObjectURL(file);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
    } catch {}
  };

  const extractAgent = () => {
    if (isRecordingVideo) mediaRecorderRef.current?.stop();
    if (isRecordingAudio) audioRecorderRef.current?.stop();

    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (wakeLockRef.current) wakeLockRef.current.release();
    
    setIsMissionActive(false);
    setIsRecordingVideo(false);
    setIsRecordingAudio(false);
    setVault([]);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-manipulation">
      {!isMissionActive ? (
        <button
          onClick={startMission}
          className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl transition-all active:scale-95"
        >
          INICIAR CALCULO
        </button>
      ) : (
        <div 
          className="relative w-full h-[100dvh] bg-black"
          onDoubleClick={() => setShowVideo(!showVideo)}
        >
          <canvas ref={canvasRef} className="hidden" />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
              showVideo ? "opacity-25" : "opacity-0"
            }`}
          />

          <div className="absolute top-6 left-6 flex gap-3 z-10">
            {isRecordingVideo && <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />}
            {isRecordingAudio && <div className="w-2 h-2 rounded-full bg-[#0a1a2a]" />}
          </div>

          {vault.length > 0 && (
            <div className="absolute top-6 right-6 text-[12px] font-mono text-[#444]">
              [{vault.length}]
            </div>
          )}

          <div className="absolute bottom-6 w-full px-6 flex justify-between z-20">
            
            <button onClick={executeVideo} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingVideo ? 'bg-[#111] border-[#333] text-[#555]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              VID
            </button>

            <button onClick={executeAudio} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingAudio ? 'bg-[#111] border-[#333] text-[#555]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              AUD
            </button>

            <button onClick={executePhoto} className="w-12 h-12 rounded-full bg-[#050505] border border-[#0a0a0a] text-[#111] flex items-center justify-center font-mono text-[10px] active:bg-[#1a1a1a] active:scale-90 transition-all">
              FOT
            </button>

            <button onClick={exportVault} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${vault.length > 0 ? 'bg-[#0a0a0a] border-[#222] text-[#555]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              EXP
            </button>

            <button onClick={extractAgent} className="w-12 h-12 rounded-full bg-[#080000] border border-[#1a0000] text-[#2a0000] flex items-center justify-center font-mono text-[10px] active:bg-[#200] active:scale-90 transition-all">
              FIN
            </button>

          </div>
        </div>
      )}
    </main>
  );
}