"use client";

import { useState, useRef } from "react";

type T0 = {
  id: number;
  url: string;
  type: "photo" | "video" | "audio";
  name: string;
  mime: string;
};

export default function Calculator() {
  const [a0, sA0] = useState(false);
  const [a1, sA1] = useState(false);
  const [a2, sA2] = useState(false);
  const [a3, sA3] = useState<T0[]>([]);
  const [a4, sA4] = useState(false);
  const r0 = useRef<HTMLVideoElement>(null);
  const r1 = useRef<HTMLCanvasElement>(null);
  const r2 = useRef<any>(null);
  const r3 = useRef<MediaRecorder | null>(null);
  const r4 = useRef<MediaRecorder | null>(null);
  const r5 = useRef<BlobPart[]>([]);
  const r6 = useRef<BlobPart[]>([]);
  const r7 = useRef<MediaStream | null>(null);

  const f0 = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      
      r7.current = stream;
      if (r0.current) {
        r0.current.srcObject = stream;
        r0.current.play().catch(() => {});
      }
      if ("wakeLock" in navigator) {
        try { r2.current = await navigator.wakeLock.request("screen"); } catch {}
      }
      sA0(true);
    } catch {
      alert("Error de acceso.");
    }
  };

  const f1 = () => {
    const v = r0.current;
    const c = r1.current;
    if (!v || !c || v.readyState === 0) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const x = c.getContext("2d");
    if (x) {
      x.drawImage(v, 0, 0, c.width, c.height);
      c.toBlob((bl) => {
        if (bl) {
          const u = URL.createObjectURL(bl);
          sA3(p => [...p, { id: Date.now(), url: u, type: "photo", name: `d1_${Date.now()}.jpg`, mime: "image/jpeg" }]);
        }
      }, "image/jpeg", 0.9);
    }
  };

  const f2 = () => {
    if (a1) {
      r3.current?.stop();
      sA1(false);
    } else {
      const s = r7.current;
      if (!s) return;
      const rec = new MediaRecorder(s);
      r5.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) r5.current.push(e.data); };
      rec.onstop = () => {
        const t = rec.mimeType || "video/mp4";
        const bl = new Blob(r5.current, { type: t });
        if (bl.size > 0) {
          const u = URL.createObjectURL(bl);
          sA3(p => [...p, { id: Date.now(), url: u, type: "video", name: `d2_${Date.now()}.mp4`, mime: t }]);
        }
      };
      rec.start(1000);
      r3.current = rec;
      sA1(true);
    }
  };

  const f3 = () => {
    if (a2) {
      r4.current?.stop();
      sA2(false);
    } else {
      const s = r7.current;
      if (!s) return;
      const at = s.getAudioTracks()[0];
      const as_ = new MediaStream([at]);
      const rec = new MediaRecorder(as_);
      r6.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) r6.current.push(e.data); };
      rec.onstop = () => {
        const t = rec.mimeType || "audio/mp4";
        const bl = new Blob(r6.current, { type: t });
        const u = URL.createObjectURL(bl);
        sA3(p => [...p, { id: Date.now(), url: u, type: "audio", name: `d3_${Date.now()}.m4a`, mime: t }]);
      };
      rec.start(1000);
      r4.current = rec;
      sA2(true);
    }
  };

  const f4 = () => {
    if (a1) r3.current?.stop();
    if (a2) r4.current?.stop();
    if (r7.current) r7.current.getTracks().forEach(t => t.stop());
    if (r2.current) r2.current.release();
    sA0(false);
    sA3([]);
    sA4(false);
  };

  const f5 = async (item: T0) => {
    try {
      const res = await fetch(item.url);
      const bl = await res.blob();
      const file = new File([bl], item.name, { type: item.mime });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Archivos" });
      } else {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.click();
      }
    } catch {}
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-black select-none overflow-hidden touch-manipulation">
      
      <video
        ref={r0}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <canvas ref={r1} className="hidden" />

      {!a0 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
             <button
                onClick={f0}
                className="rounded-full bg-[#050505] px-12 py-6 text-xs font-semibold tracking-widest text-[#111] shadow-xl active:bg-[#0a0a0a] transition-all"
            >
                INICIAR
            </button>
        </div>
      )}

      {a0 && (
        <>
            <div className="absolute top-10 left-6 flex gap-3 z-40 pointer-events-none">
                {a1 && <div className="w-1.5 h-1.5 rounded-full bg-[#1a0000]" />}
                {a2 && <div className="w-1.5 h-1.5 rounded-full bg-[#000a1a]" />}
            </div>
            {a3.length > 0 && (
                <div className="absolute top-10 right-6 text-[10px] font-mono text-[#0a0a0a] z-40 pointer-events-none">
                {a3.length}
                </div>
            )}
            <div className="absolute bottom-8 w-full px-6 flex justify-between items-center z-40">
                <button onClick={f2} className={`w-16 h-16 rounded-full flex items-center justify-center font-mono text-[11px] active:scale-90 transition-all ${a1 ? 'text-[#2a0000]' : 'text-[#0a0a0a]'}`}>
                C1
                </button>
                <button onClick={f3} className={`w-16 h-16 rounded-full flex items-center justify-center font-mono text-[11px] active:scale-90 transition-all ${a2 ? 'text-[#001a2a]' : 'text-[#0a0a0a]'}`}>
                C2
                </button>
                <button onClick={f1} className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-[11px] text-[#0a0a0a] active:bg-[#050505] active:scale-90 transition-all">
                C3
                </button>
                <button onClick={() => { if(a3.length > 0) sA4(true) }} className={`w-16 h-16 rounded-full flex items-center justify-center font-mono text-[11px] active:scale-90 transition-all ${a3.length > 0 ? 'text-[#1a1a1a]' : 'text-[#0a0a0a]'}`}>
                C4
                </button>
                <button onClick={f4} className="w-16 h-16 rounded-full flex items-center justify-center font-mono text-[11px] text-[#110000] active:bg-[#050000] active:scale-90 transition-all">
                C5
                </button>
            </div>
        </>
      )}

      {a4 && (
        <div className="fixed inset-0 z-[100] bg-[#000000] flex flex-col items-center pt-10 px-4 overflow-y-auto pb-32">
          <div className="w-full max-w-lg flex flex-col gap-8">
            {a3.map(item => (
              <div key={item.id} className="w-full bg-[#050505] rounded-xl p-4 flex flex-col items-center shadow-2xl">
                <div className="w-full mb-4">
                  {item.type === "photo" && <img src={item.url} className="w-full h-auto rounded-lg opacity-90" />}
                  {item.type === "video" && <video src={item.url} controls playsInline className="w-full h-auto rounded-lg opacity-90" />}
                  {item.type === "audio" && <audio src={item.url} controls className="w-full opacity-90" />}
                </div>
                <button
                  onClick={() => f5(item)}
                  className="w-full bg-[#111] hover:bg-[#222] active:scale-95 transition-all text-zinc-400 font-mono text-[11px] py-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  GUARDAR EN EL DISPOSITIVO
                </button>

              </div>
            ))}
          </div>
          <button
            onClick={() => sA4(false)}
            className="fixed bottom-10 bg-[#111] border border-[#222] text-zinc-500 font-mono text-[10px] px-10 py-4 rounded-full shadow-2xl active:scale-95 transition-all"
          >
            VOLVER
          </button>
        </div>
      )}
    </main>
  );
}