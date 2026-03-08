"use client";

import { useState, useRef } from "react";

export default function Calculator() {
  const [a0, sA0] = useState(false);
  const [b0, sB0] = useState(false);
  const [c0, sC0] = useState(false);
  const [d0, sD0] = useState(false);
  const [e0, sE0] = useState<File[]>([]);
  
  const r1 = useRef<HTMLVideoElement>(null);
  const r2 = useRef<HTMLCanvasElement>(null);
  const r3 = useRef<any>(null);
  const r4 = useRef<MediaRecorder | null>(null);
  const r5 = useRef<MediaRecorder | null>(null);
  const r6 = useRef<BlobPart[]>([]);
  const r7 = useRef<BlobPart[]>([]);

  const fn1 = async () => {
    try {
      if ("wakeLock" in navigator) r3.current = await navigator.wakeLock.request("screen");
    } catch {}
  };

  const fn2 = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      if (r1.current) r1.current.srcObject = s;
      await fn1();
      sA0(true);
      sB0(false);
    } catch {
      alert("Error de acceso.");
    }
  };

  const fn3 = () => {
    if (!r1.current || !r2.current) return;
    const v = r1.current;
    const c = r2.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const x = c.getContext("2d");
    if (x) {
      x.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob((bl) => {
        if (bl) sE0((p) => [...p, new File([bl], `dt_${Date.now()}.jpg`, { type: "image/jpeg" })]);
      }, "image/jpeg", 0.9);
    }
    sB0(true);
    setTimeout(() => sB0(false), 150);
  };

  const fn4 = () => {
    if (c0) {
      r4.current?.stop();
      sC0(false);
    } else {
      const s = r1.current?.srcObject as MediaStream;
      if (!s) return;
      const rec = new MediaRecorder(s);
      r6.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) r6.current.push(e.data); };
      rec.onstop = () => {
        const bl = new Blob(r6.current, { type: "video/mp4" });
        sE0((p) => [...p, new File([bl], `dt_${Date.now()}.mp4`, { type: "video/mp4" })]);
      };
      rec.start();
      r4.current = rec;
      sC0(true);
    }
  };

  const fn5 = () => {
    if (d0) {
      r5.current?.stop();
      sD0(false);
    } else {
      const s = r1.current?.srcObject as MediaStream;
      if (!s) return;
      const at = s.getAudioTracks()[0];
      const as_ = new MediaStream([at]);
      const rec = new MediaRecorder(as_);
      r7.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) r7.current.push(e.data); };
      rec.onstop = () => {
        const bl = new Blob(r7.current, { type: "audio/mp4" });
        sE0((p) => [...p, new File([bl], `dt_${Date.now()}.m4a`, { type: "audio/mp4" })]);
      };
      rec.start();
      r5.current = rec;
      sD0(true);
    }
  };

  const fn6 = async () => {
    if (e0.length === 0) return;
    try {
      if (navigator.canShare && navigator.canShare({ files: e0 })) {
        await navigator.share({ files: e0, title: "Archivos" });
      } else {
        e0.forEach((f) => {
          const u = URL.createObjectURL(f);
          const a = document.createElement("a");
          a.href = u;
          a.download = f.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
    } catch {}
  };

  const fn7 = () => {
    if (c0) r4.current?.stop();
    if (d0) r5.current?.stop();
    const s = r1.current?.srcObject as MediaStream;
    if (s) s.getTracks().forEach((t) => t.stop());
    if (r3.current) r3.current.release();
    sA0(false);
    sC0(false);
    sD0(false);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-none">
      {!a0 ? (
        <button
          onClick={fn2}
          className="rounded-full bg-zinc-900 px-8 py-4 text-sm font-semibold tracking-widest text-zinc-500 shadow-xl transition-all active:scale-95"
        >
          INICIAR CALCULO
        </button>
      ) : (
        <div
          className="relative w-full h-[100dvh] bg-black flex flex-col justify-between"
          onDoubleClick={() => sB0(!b0)}
        >
          <canvas ref={r2} className="hidden" />

          <video
            ref={r1}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
              b0 ? "opacity-25" : "opacity-0"
            }`}
          />

          <div className="absolute top-8 left-4 flex gap-3 z-10">
            {c0 && <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-[0_0_2px_#333]" />}
            {d0 && <div className="w-2 h-2 rounded-full bg-[#0a1a2a] shadow-[0_0_2px_#333]" />}
          </div>

          {e0.length > 0 && (
            <div className="absolute top-8 right-4 text-[10px] font-mono text-[#333]">
              [{e0.length}]
            </div>
          )}

          <div className="absolute bottom-8 w-full px-4 flex justify-between z-10 gap-1">
            <button onClick={fn4} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] transition-colors ${c0 ? 'bg-[#111] border-[#333] text-[#444]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              C1
            </button>
            <button onClick={fn5} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] transition-colors ${d0 ? 'bg-[#111] border-[#333] text-[#444]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              C2
            </button>
            <button onClick={fn3} className="w-12 h-12 rounded-full bg-[#050505] border border-[#0a0a0a] text-[#111] flex items-center justify-center font-mono text-[10px] active:bg-[#111]">
              C3
            </button>
            <button onClick={fn6} className={`w-12 h-12 rounded-full border flex items-center justify-center font-mono text-[10px] transition-colors ${e0.length > 0 ? 'bg-[#0a0a0a] border-[#222] text-[#444]' : 'bg-[#050505] border-[#0a0a0a] text-[#111]'}`}>
              C4
            </button>
            <button onClick={fn7} className="w-12 h-12 rounded-full bg-[#080000] border border-[#1a0000] text-[#2a0000] flex items-center justify-center font-mono text-[10px] active:bg-[#200]">
              C5
            </button>
          </div>
        </div>
      )}
    </main>
  );
}