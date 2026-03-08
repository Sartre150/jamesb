"use client";

import { useState, useRef, useEffect } from "react";

export default function SpyGadget() {
  const [isMissionActive, setIsMissionActive] = useState(false);
  const[showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<any>(null);

  // Función para evitar que el iPhone apague la pantalla (Magia pura)
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        console.log("WakeLock activo: La pantalla no se apagará.");
      }
    } catch (err) {
      console.error("WakeLock falló:", err);
    }
  };

  // Función principal: Iniciar el modo espía
  const startMission = async () => {
    try {
      // 1. Pedimos cámara trasera (facingMode: environment) y micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });

      // 2. Conectamos el video a nuestra etiqueta oculta
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Activamos el anti-bloqueo de pantalla
      await requestWakeLock();

      // 4. Cambiamos el estado para poner todo negro
      setIsMissionActive(true);
      setShowVideo(false); // Empieza invisible por defecto

    } catch (error) {
      alert("Misión abortada: Permisos denegados.");
      console.error(error);
    }
  };

  // Gesto secreto para ver la cámara o volver a esconderla
  const handleSecretDoubleTap = () => {
    if (isMissionActive) {
      setShowVideo(!showVideo);
    }
  };

  return (
    <main 
      className="flex min-h-screen flex-col items-center justify-center bg-black transition-all duration-500"
      onDoubleClick={handleSecretDoubleTap} // El doble toque mágico
    >
      {!isMissionActive ? (
        // UI de inicio: Un botón minimalista
        <button
          onClick={startMission}
          className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl transition-all hover:bg-zinc-800 focus:outline-none active:scale-95"
        >
          INICIAR CALCULO
        </button>
      ) : (
        // Modo Fantasma: Pantalla 100% negra
        <div className="relative w-full h-screen bg-black flex items-center justify-center">
          
          {/* El video está aquí, pero solo se ve si showVideo es true */}
          <video
            ref={videoRef}
            autoPlay
            playsInline // VITAL para iOS, evita que el video se abra en pantalla completa nativa
            muted // Lo silenciamos en la reproducción para que no haya eco de tu propia voz
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              showVideo ? "opacity-30" : "opacity-0"
            }`}
          />
          
          {/* Instrucción oculta que apenas se ve para el agente */}
          {!showVideo && (
            <p className="absolute bottom-10 text-[8px] text-zinc-900">
              Doble toque para encuadrar.
            </p>
          )}
        </div>
      )}
    </main>
  );
}