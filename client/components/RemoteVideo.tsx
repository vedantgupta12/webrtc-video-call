"use client";

import { RefObject } from "react";

interface RemoteVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function RemoteVideo({ videoRef }: RemoteVideoProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-center py-4">
        <h2 className="text-xl font-semibold text-white">
          Remote Video
        </h2>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="h-full w-full flex-1 object-cover"
      />
    </div>
  );
}