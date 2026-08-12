"use client";

import { useEffect, useRef } from "react";
import { socket } from "@/lib/socket";
import LocalVideo from "@/components/LocalVideo";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startCamera();

    const handleConnect = () => {
      console.log("Connected:", socket.id);
    };

    const handleDisconnect = () => {
      console.log("Disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  return (
    <main className="flex h-screen items-center justify-center">
      <LocalVideo videoRef={videoRef} />
    </main>
  );
}