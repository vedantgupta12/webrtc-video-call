"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
const handleStartCall = () => {
  const roomId =
    Math.random().toString(36).substring(2, 8) +
    Date.now().toString(36).substring(2, 6);

  router.push(`/room/${roomId}`);
};

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A0D12] p-6 text-white">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(45,212,191,0.12),transparent)]" />

      {/* Main content */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">

        {/* Logo / Icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-400/20 bg-teal-400/10 text-4xl shadow-[0_0_40px_rgba(45,212,191,0.08)]">
          🎥
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          WebRTC Video Call
        </h1>

        {/* Description */}
        <p className="mt-4 max-w-lg text-base leading-7 text-white/50 sm:text-lg">
          Start a video call instantly. No account or sign-up required.
          Just create a room and share the link.
        </p>

        {/* Start Call Button */}
        <button
          onClick={handleStartCall}
          className="mt-8 rounded-full bg-teal-400 px-8 py-3.5 text-sm font-semibold text-[#0A0D12] shadow-[0_0_30px_rgba(45,212,191,0.12)] transition hover:bg-teal-300 hover:shadow-[0_0_40px_rgba(45,212,191,0.18)] active:scale-95"
        >
          🎥 Start Video Call
        </button>

        {/* Small information */}
        <div className="mt-8 flex items-center gap-2 text-sm text-white/30">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          No registration required
        </div>

      </div>
    </main>
  );
}