"use client";

import { useState, useRef, useEffect } from "react";

type VaultItem = {
  id: number;
  url: string;
  type: "photo" | "video" | "audio";
};

export default function KGBDevice() {
  const[isMissionActive, setIsMissionActive] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [showDarkRoom, setShowDarkRoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLockRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioChunksRef = useRef<BlobPart[]>([]);


  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  },[]);

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
      if (videoRef.current) videoRef.current.srcObject = stream;
      await requestWakeLock();
      setIsMissionActive(true);
      setShowVideo(false);
    } catch {
      alert("Acceso denegado.");
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
          const url = URL.createObjectURL(blob);
          setVault(prev => [...prev, { id: Date.now(), url, type: "photo" }]);
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
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || 'video/mp4';
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setVault(prev => [...prev, { id: Date.now(), url, type: "video" }]);
      };
      recorder.start(1000);
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
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/mp4';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setVault(prev => [...prev, { id: Date.now(), url, type: "audio" }]);
      };
      recorder.start(1000);
      audioRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    }
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

  // --- INTERFAZ ---
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-manipulation">
      {showDarkRoom && (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-start pt-10 px-4 overflow-y-auto">
          <p className="text-zinc-600 font-mono text-xs mb-6 text-center animate-pulse">
            MANTÉN PRESIONADO EL ARCHIVO PARA GUARDAR EN FOTOS.
          </p>
          
          <div className="w-full max-w-lg flex flex-col gap-6 pb-20">
            {vault.map(item => (
              <div key={item.id} className="w-full bg-black p-2 border border-zinc-900 rounded-lg shadow-2xl">
                {item.type === "photo" && <img src={item.url} className="w-full h-auto rounded" alt="Evidencia" />}
                {item.type === "video" && <video src={item.url} controls playsInline className="w-full h-auto rounded" />}
                {item.type === "audio" && <audio src={item.url} controls className="w-full" />}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowDarkRoom(false)} 
            className="fixed bottom-6 bg-[#111] border border-[#333] text-zinc-500 font-mono text-xs px-8 py-4 rounded-full shadow-xl active:bg-[#222]"
          >
            VOLVER A LAS SOMBRAS
          </button>
        </div>
      )}

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
          {isPortrait && (
            <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center backdrop-blur-sm">
              <p className="text-red-800 font-mono text-xs tracking-widest text-center border border-red-900 p-4 bg-black">
                SISTEMA BLOQUEADO. <br/><br/>
                ROTE EL DISPOSITIVO A MODO HORIZONTAL.
              </p>
            </div>
          )}

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

            <button onClick={() => { if(vault.length > 0) setShowDarkRoom(true) }} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${vault.length > 0 ? 'bg-[#0a0a0a] border-[#222] text-[#555]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
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