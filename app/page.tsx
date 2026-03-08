"use client";

import { useState, useRef } from "react";

export default function KGBDevice() {
  const [isMissionActive, setIsMissionActive] = useState(false);
  const[showVideo, setShowVideo] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
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
    } catch (err) {
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
      alert("Comando central: El objetivo bloqueó los accesos.");
    }
  };

  const smuggleFile = (blob: Blob, filename: string) => {
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
        if (blob) smuggleFile(blob, `kgb_doc_${Date.now()}.jpg`);
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
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/mp4" });
        smuggleFile(blob, `kgb_vid_${Date.now()}.mp4`);
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
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/mp4" });
        smuggleFile(blob, `kgb_aud_${Date.now()}.m4a`);
      };

      recorder.start();
      audioRecorderRef.current = recorder;
      setIsRecordingAudio(true);
    }
  };

  const extractAgent = () => {
    if (isRecordingVideo) mediaRecorderRef.current?.stop();
    if (isRecordingAudio) audioRecorderRef.current?.stop();

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

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-none">
      {!isMissionActive ? (
        <button
          onClick={startMission}
          className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl transition-all active:scale-95"
        >
          INICIAR CALCULO
        </button>
      ) : (
        <div 
          className="relative w-full h-[100dvh] bg-black flex flex-col justify-between"
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

          <div className="absolute top-8 left-4 flex gap-3 z-10">
            {isRecordingVideo && <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-[0_0_2px_#333]" />}
            {isRecordingAudio && <div className="w-2 h-2 rounded-full bg-[#0a1a2a] shadow-[0_0_2px_#333]" />}
          </div>

          <div className="absolute bottom-8 w-full px-6 flex justify-between z-10">
            
            <button 
              onClick={executeVideo} 
              className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-xs transition-colors ${isRecordingVideo ? 'bg-[#111] border-[#333] text-[#444]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}
            >
              VID
            </button>

            <button 
              onClick={executeAudio} 
              className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-xs transition-colors ${isRecordingAudio ? 'bg-[#111] border-[#333] text-[#444]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}
            >
              AUD
            </button>

            <button 
              onClick={executePhoto} 
              className="w-14 h-14 rounded-full bg-[#050505] border border-[#0a0a0a] text-[#111] flex items-center justify-center font-mono text-xs active:bg-[#111]"
            >
              FOT
            </button>

            <button 
              onClick={extractAgent} 
              className="w-14 h-14 rounded-full bg-[#080000] border border-[#1a0000] text-[#2a0000] flex items-center justify-center font-mono text-xs active:bg-[#200]"
            >
              FIN
            </button>

          </div>
        </div>
      )}
    </main>
  );
}