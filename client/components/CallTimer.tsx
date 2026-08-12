"use client";

import { useEffect, useState } from "react";

interface CallTimerProps {
  isConnected: boolean;
}

export default function CallTimer({
  isConnected,
}: CallTimerProps) {
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isConnected]);

  const minutes = Math.floor(callDuration / 60);
  const seconds = callDuration % 60;

  return (
    <div className="mb-4 text-xl font-semibold text-white">
      {String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}