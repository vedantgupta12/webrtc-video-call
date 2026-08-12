"use client";

import { RefObject } from "react";

interface LocalVideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function LocalVideo({ videoRef }: LocalVideoProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-center py-4">
        <h2 className="text-xl font-semibold text-white">
          Local Video
        </h2>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-full w-full flex-1 object-cover"
      />
    </div>
  );
}