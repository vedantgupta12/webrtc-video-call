// hooks/useWebRTC.ts

import { useRef } from "react";

export function useWebRTC() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
 const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  return {
    videoRef,
    remoteVideoRef,
    streamRef,
    screenStreamRef,
    peerConnectionRef,
  };
}