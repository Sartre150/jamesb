"use client";

import { useState, useRef, useEffect } from "react";

type VaultItem = {
  id: number;
  url: string;
  type: "photo" | "video" | "audio";
  name: string;
};

export default function KGBDevice() {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
    console.log(msg);
  };

  const [isMissionActive, setIsMissionActive] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [vault, setVault] = useState<VaultItem[]>([]);
  const [showDarkRoom, setShowDarkRoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeLockRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startMission = async () => {
    addLog("Inicializando hardware...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      addLog("Cámara/Micro OK");

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
           addLog(`Video cargado: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        };
      }

      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
          addLog("WakeLock Activo");
        } catch (e) {
          addLog("Fallo WakeLock (No crítico)");
        }
      }

      setIsMissionActive(true);
    } catch (err: any) {
      addLog(`ERROR FATAL: ${err.message || err}`);
      alert("Error: " + err.message);
    }
  };

  const executePhoto = () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        addLog("Error: Refs nulos en Foto");
        return;
      }
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState < 2) {
        addLog("Cámara no lista aún");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const name = `FOT_${Date.now()}.jpg`;
            setVault(prev => [...prev, { id: Date.now(), url, type: "photo", name }]);
            addLog(`Foto guardada: ${Math.round(blob.size / 1024)}KB`);
          } else {
            addLog("Error: Blob de foto vacío");
          }
        }, "image/jpeg", 0.9);
      }
      setShowVideo(true);
      setTimeout(() => setShowVideo(false), 150);

    } catch (e: any) {
      addLog(`Error Foto: ${e.message}`);
    }
  };

  const executeVideo = () => {
    if (isRecordingVideo) {
      addLog("Deteniendo video...");
      mediaRecorderRef.current?.stop();
      setIsRecordingVideo(false);
    } else {
      try {
        const stream = videoRef.current?.srcObject as MediaStream;
        if (!stream) {
           addLog("Error: No hay stream de video");
           return;
        }

        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const type = recorder.mimeType || "video/mp4";
          const blob = new Blob(chunksRef.current, { type });
          
          if (blob.size === 0) {
            addLog("ERROR: Video final vacío (0 bytes)");
            return;
          }

          const url = URL.createObjectURL(blob);
          const ext = type.includes("webm") ? "webm" : "mp4";
          const name = `VID_${Date.now()}.${ext}`;
          
          setVault(prev => [...prev, { id: Date.now(), url, type: "video", name }]);
          addLog(`Video Guardado (${Math.round(blob.size/1024)}KB)`);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingVideo(true);
        addLog("Grabando Video...");
        
      } catch (e: any) {
        addLog(`Error Start Video: ${e.message}`);
      }
    }
  };

  const executeAudio = () => {
    if (isRecordingAudio) {
      addLog("Deteniendo audio...");
      audioRecorderRef.current?.stop();
      setIsRecordingAudio(false);
    } else {
      try {
        const stream = videoRef.current?.srcObject as MediaStream;
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            addLog("Error: No hay micrófono detectado");
            return;
        }
        
        const audioStream = new MediaStream([audioTracks[0]]);
        const recorder = new MediaRecorder(audioStream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const type = recorder.mimeType || "audio/mp4";
          const blob = new Blob(audioChunksRef.current, { type });
          const url = URL.createObjectURL(blob);
          const name = `AUD_${Date.now()}.m4a`;
          setVault(prev => [...prev, { id: Date.now(), url, type: "audio", name }]);
          addLog(`Audio Guardado (${Math.round(blob.size/1024)}KB)`);
        };

        recorder.start(1000);
        audioRecorderRef.current = recorder;
        setIsRecordingAudio(true);
        addLog("Grabando Audio...");

      } catch (e: any) {
        addLog(`Error Audio: ${e.message}`);
      }
    }
  };

  const openDarkRoom = () => {
      addLog(`Abriendo Bóveda: ${vault.length} items`);
      if (vault.length > 0) {
          setShowDarkRoom(true);
      } else {
          addLog("Bóveda vacía.");
      }
  };

  const extractAgent = () => {
    if (isRecordingVideo) mediaRecorderRef.current?.stop();
    if (isRecordingAudio) audioRecorderRef.current?.stop();
    const stream = videoRef.current?.srcObject as MediaStream;
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (wakeLockRef.current) wakeLockRef.current.release();
    setIsMissionActive(false);
    setLogs([]);
    setVault([]);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-manipulation">
      
      {showDarkRoom && (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center pt-10 px-4 overflow-y-auto">
          <h2 className="text-white font-mono text-sm mb-2">BÓVEDA DE EVIDENCIA</h2>
          <p className="text-zinc-500 font-mono text-[10px] mb-6 text-center">
            MANTÉN PRESIONADO UN ARCHIVO PARA GUARDAR
          </p>
          
          <div className="w-full max-w-lg flex flex-col gap-6 pb-32">
            {vault.map(item => (
              <div key={item.id} className="w-full bg-black border border-zinc-800 rounded p-2">
                <p className="text-zinc-600 text-[9px] mb-1 font-mono">{item.name}</p>
                
                {item.type === "photo" && (
                   <img src={item.url} className="w-full h-auto" alt="evidencia" />
                )}
                
                {item.type === "video" && (
                   <video src={item.url} controls playsInline className="w-full h-auto" />
                )}
                
                {item.type === "audio" && (
                   <audio src={item.url} controls className="w-full mt-2" />
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowDarkRoom(false)} 
            className="fixed bottom-10 bg-white text-black font-bold text-xs px-6 py-3 rounded-full shadow-xl z-50"
          >
            X CERRAR
          </button>
        </div>
      )}

      {!isMissionActive ? (
        <div className="flex flex-col items-center gap-4">
            <button
            onClick={startMission}
            className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl active:scale-95"
            >
            INICIAR CALCULO
            </button>
            <div className="text-[10px] text-red-500 font-mono h-10 w-64 text-center">
                {logs[0]}
            </div>
        </div>
      ) : (
        <div 
          className="relative w-full h-[100dvh] bg-black"
          onDoubleClick={() => setShowVideo(!showVideo)}
        >
          <div className="absolute top-0 left-0 w-full p-2 bg-black/50 z-50 pointer-events-none">
             {logs.map((log, i) => (
                 <p key={i} className="text-[10px] text-green-500 font-mono leading-tight opacity-70">
                     {`> ${log}`}
                 </p>
             ))}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
              showVideo ? "opacity-30" : "opacity-0"
            }`}
          />

          <div className="absolute top-14 left-4 flex gap-3 z-10 opacity-50">
            {isRecordingVideo && <div className="w-3 h-3 rounded-full bg-red-900 animate-pulse" />}
            {isRecordingAudio && <div className="w-3 h-3 rounded-full bg-blue-900 animate-pulse" />}
          </div>

          {vault.length > 0 && (
            <div className="absolute top-14 right-4 text-xs font-mono text-zinc-600">
              FILES: {vault.length}
            </div>
          )}

          <div className="absolute bottom-10 w-full px-4 flex justify-between items-center z-40">
            
            <button onClick={executeVideo} className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingVideo ? 'bg-zinc-900 border-zinc-700 text-red-500' : 'bg-black border-zinc-900 text-zinc-700'}`}>
              VID
            </button>

            <button onClick={executeAudio} className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingAudio ? 'bg-zinc-900 border-zinc-700 text-blue-500' : 'bg-black border-zinc-900 text-zinc-700'}`}>
              AUD
            </button>

            <button onClick={executePhoto} className="w-14 h-14 rounded-full bg-black border border-zinc-900 text-zinc-700 flex items-center justify-center font-mono text-[10px] active:bg-zinc-900 active:scale-90">
              FOT
            </button>

            <button 
                onClick={openDarkRoom} 
                className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${vault.length > 0 ? 'bg-zinc-900 border-zinc-600 text-white' : 'bg-black border-zinc-900 text-zinc-800'}`}
            >
              EXP
            </button>

            <button onClick={extractAgent} className="w-14 h-14 rounded-full bg-[#110000] border border-[#330000] text-[#550000] flex items-center justify-center font-mono text-[10px] active:bg-red-950 active:scale-90">
              FIN
            </button>
          </div>
        </div>
      )}
    </main>
  );
}