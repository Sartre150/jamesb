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
  const streamRef = useRef<MediaStream | null>(null);

  const startMission = async () => {
    addLog("Iniciando protocolos...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      
      addLog("Hardware conectado.");
      
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        addLog("Video inyectado en pantalla.");
      } else {
        addLog("ERROR CRÍTICO: Ref de video perdido.");
      }

      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        } catch (e) {}
      }

      setIsMissionActive(true);

    } catch (err: any) {
      addLog(`ERROR ACCESO: ${err.message}`);
      alert("Permisos denegados. Reinicia la app.");
    }
  };

  const executePhoto = () => {
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        addLog("Error: Sistema visual no encontrado");
        return;
      }
      
      if (video.readyState === 0) {
        addLog("Cámara cargando... intenta de nuevo");
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
            setVault(prev => [...prev, { id: Date.now(), url, type: "photo", name: `FOT_${Date.now()}.jpg` }]);
            addLog(`Foto Capturada [${Math.round(blob.size/1024)}KB]`);
          }
        }, "image/jpeg", 0.9);
      }
      
      setShowVideo(true);
      setTimeout(() => setShowVideo(false), 150);
    } catch (e: any) {
      addLog(`Error FOT: ${e.message}`);
    }
  };

  const executeVideo = () => {
    if (isRecordingVideo) {
      mediaRecorderRef.current?.stop();
      setIsRecordingVideo(false);
      addLog("Finalizando video...");
    } else {
      try {
        const stream = streamRef.current;
        
        if (!stream) {
           addLog("Error Fatal: No hay señal de cámara");
           return;
        }

        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];
        
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        recorder.onstop = () => {
          const type = recorder.mimeType || "video/mp4";
          const blob = new Blob(chunksRef.current, { type });
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            setVault(prev => [...prev, { id: Date.now(), url, type: "video", name: `VID_${Date.now()}.mp4` }]);
            addLog(`Video Guardado [${Math.round(blob.size/1024)}KB]`);
          } else {
            addLog("Error: Grabación vacía");
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecordingVideo(true);
        addLog("GRABANDO VIDEO...");
        
      } catch (e: any) {
        addLog(`Error VID: ${e.message}`);
      }
    }
  };

  const executeAudio = () => {
    if (isRecordingAudio) {
      audioRecorderRef.current?.stop();
      setIsRecordingAudio(false);
      addLog("Finalizando audio...");
    } else {
      try {
        const stream = streamRef.current;
        if (!stream) {
            addLog("Error: Sin señal de micro");
            return;
        }

        const audioTrack = stream.getAudioTracks()[0];
        const audioStream = new MediaStream([audioTrack]);
        const recorder = new MediaRecorder(audioStream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const type = recorder.mimeType || "audio/mp4";
          const blob = new Blob(audioChunksRef.current, { type });
          const url = URL.createObjectURL(blob);
          setVault(prev => [...prev, { id: Date.now(), url, type: "audio", name: `AUD_${Date.now()}.m4a` }]);
          addLog(`Audio Guardado [${Math.round(blob.size/1024)}KB]`);
        };

        recorder.start(1000);
        audioRecorderRef.current = recorder;
        setIsRecordingAudio(true);
        addLog("GRABANDO AUDIO...");

      } catch (e: any) {
        addLog(`Error AUD: ${e.message}`);
      }
    }
  };

  const extractAgent = () => {
    if (isRecordingVideo) mediaRecorderRef.current?.stop();
    if (isRecordingAudio) audioRecorderRef.current?.stop();
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (wakeLockRef.current) wakeLockRef.current.release();
    
    setIsMissionActive(false);
    setLogs([]);
    setVault([]);
    setShowDarkRoom(false);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-manipulation">
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
          isMissionActive ? (showVideo ? "opacity-30" : "opacity-0") : "opacity-0"
        }`}
        style={{ zIndex: 0 }} 
      />
      
      <canvas ref={canvasRef} className="hidden" />

      {!isMissionActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
             <button
                onClick={startMission}
                className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl active:scale-95"
            >
                INICIAR CALCULO
            </button>
            <div className="mt-4 text-[10px] text-green-800 font-mono h-6">{logs[0]}</div>
        </div>
      )}

      {isMissionActive && (
        <>

            <div className="absolute top-0 left-0 w-full p-2 bg-gradient-to-b from-black to-transparent z-40 pointer-events-none">
                {logs.map((log, i) => (
                    <p key={i} className="text-[10px] text-green-500 font-mono leading-tight opacity-70 shadow-black drop-shadow-md">
                        {`> ${log}`}
                    </p>
                ))}
            </div>

            <div className="absolute top-14 left-4 flex gap-3 z-40 opacity-50 pointer-events-none">
                {isRecordingVideo && <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_red]" />}
                {isRecordingAudio && <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse shadow-[0_0_10px_blue]" />}
            </div>

            {vault.length > 0 && (
                <div className="absolute top-14 right-4 text-xs font-mono text-zinc-500 z-40 pointer-events-none">
                [{vault.length}]
                </div>
            )}

            <div className="absolute bottom-8 w-full px-4 flex justify-between items-center z-40">
                <button onClick={executeVideo} className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingVideo ? 'bg-zinc-900 border-zinc-500 text-red-500' : 'bg-black border-zinc-800 text-zinc-600'}`}>
                VID
                </button>

                <button onClick={executeAudio} className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${isRecordingAudio ? 'bg-zinc-900 border-zinc-500 text-blue-500' : 'bg-black border-zinc-800 text-zinc-600'}`}>
                AUD
                </button>

                <button onClick={executePhoto} className="w-14 h-14 rounded-full bg-black border border-zinc-800 text-zinc-600 flex items-center justify-center font-mono text-[10px] active:bg-zinc-900 active:scale-90">
                FOT
                </button>

                <button onClick={() => { if(vault.length > 0) setShowDarkRoom(true) }} className={`w-14 h-14 rounded-full border flex items-center justify-center font-mono text-[10px] active:scale-90 transition-all ${vault.length > 0 ? 'bg-zinc-900 border-zinc-500 text-white' : 'bg-black border-zinc-800 text-zinc-600'}`}>
                EXP
                </button>

                <button onClick={extractAgent} className="w-14 h-14 rounded-full bg-[#110000] border border-[#330000] text-[#550000] flex items-center justify-center font-mono text-[10px] active:bg-red-950 active:scale-90">
                FIN
                </button>
            </div>
        </>
      )}

      {showDarkRoom && (
        <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center pt-10 px-4 overflow-y-auto">
          <h2 className="text-zinc-400 font-mono text-xs mb-2 tracking-widest">BÓVEDA DE EVIDENCIA</h2>
          <p className="text-zinc-600 font-mono text-[9px] mb-8 text-center">
            MANTÉN PRESIONADO PARA GUARDAR
          </p>
          
          <div className="w-full max-w-lg flex flex-col gap-6 pb-32">
            {vault.map(item => (
              <div key={item.id} className="w-full bg-black border border-zinc-900 rounded p-2 shadow-2xl">
                <p className="text-zinc-700 text-[9px] mb-2 font-mono text-right">{item.name}</p>
                {item.type === "photo" && <img src={item.url} className="w-full h-auto rounded opacity-80" />}
                {item.type === "video" && <video src={item.url} controls playsInline className="w-full h-auto rounded opacity-80" />}
                {item.type === "audio" && <audio src={item.url} controls className="w-full mt-2 opacity-80" />}
              </div>
            ))}
          </div>

          <button 
            onClick={() => setShowDarkRoom(false)} 
            className="fixed bottom-10 bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono text-[10px] px-8 py-3 rounded-full shadow-xl active:bg-black"
          >
            VOLVER
          </button>
        </div>
      )}
    </main>
  );
}