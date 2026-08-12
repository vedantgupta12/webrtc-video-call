"use client";

import RemoteVideo from "@/components/RemoteVideo";
import LocalVideo from "@/components/LocalVideo";
import CallControls from "@/components/CallControls";

import CallTimer from "@/components/CallTimer";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { socket } from "@/lib/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
import ChatPanel from "@/components/ChatPanel";


export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();

  const {
    videoRef,
    remoteVideoRef,
    streamRef,
    screenStreamRef,
    peerConnectionRef,
  } = useWebRTC();



  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);


  const [isRemoteMicOn, setIsRemoteMicOn] = useState(true);
  const [isRemoteCameraOn, setIsRemoteCameraOn] =
    useState(true);


  const [otherUserLeft, setOtherUserLeft] =
    useState(false);

  const [connectionState, setConnectionState] =
    useState<RTCPeerConnectionState>("new");

    const [isScreenSharing, setIsScreenSharing] = useState(false);

  useEffect(() => {
    if (!roomId) return;


    // CREATE PEER CONNECTION
  

    const createPeerConnection = () => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;

    console.log("Connection State:", state);

    setConnectionState(state);

    if (state === "connected") {
      setIsCallActive(true);
    }

    if (
      state === "disconnected" ||
      state === "failed" ||
      state === "closed"
    ) {
      console.log("WebRTC connection lost");

      setIsCallActive(false);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      setOtherUserLeft(true);
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log(
      "ICE Connection State:",
      peerConnection.iceConnectionState
    );
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ICE Candidate Found");

      socket.emit("ice-candidate", {
        roomId,
        candidate: event.candidate,
      });
    }
  };

  peerConnection.ontrack = (event) => {
    console.log("Remote Track Received");

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = event.streams[0];
    }
  };

  return peerConnection;
};


    // START CAMERA


    const startCamera = async () => {
      try {
        const mediaStream =
          await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

        streamRef.current = mediaStream;

        // Local video
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Create PeerConnection
        peerConnectionRef.current =
          createPeerConnection();

        // Add local tracks
        mediaStream.getTracks().forEach((track) => {
          peerConnectionRef.current?.addTrack(
            track,
            mediaStream
          );
        });

        console.log("Peer Connection Created");
      } catch (error) {
        console.error(
          "Error accessing media:",
          error
        );
      }
    };

    
    // INITIALIZE


    const initialize = async () => {
      await startCamera();

      socket.emit("join-room", roomId);

      console.log("Joined Room:", roomId);
    };

    initialize();

    
    // WAITING


    socket.on("waiting", () => {
      console.log("Waiting for another user...");
    });

  
    // READY
   

    socket.on("ready", () => {
      console.log("Room is ready!");

      setOtherUserLeft(false);
    });


    // ROOM FULL
  

    socket.on("room-full", () => {
      console.log("Room is full!");
    });

   
    // REQUEST MEDIA STATE
  

    socket.on("request-media-state", () => {
      const audioTrack =
        streamRef.current?.getAudioTracks()[0];

      const videoTrack =
        streamRef.current?.getVideoTracks()[0];

      const currentMicState =
        audioTrack?.enabled ?? false;

      const currentCameraState =
        videoTrack?.enabled ?? false;

      socket.emit("media-state", {
        roomId,
        isMicOn: currentMicState,
        isCameraOn: currentCameraState,
      });
    });


    // RECEIVE MEDIA STATE
  

    socket.on(
      "media-state",
      ({
        isMicOn,
        isCameraOn,
      }: {
        isMicOn: boolean;
        isCameraOn: boolean;
      }) => {
        console.log(
          "Remote Media State:",
          isMicOn,
          isCameraOn
        );

        setIsRemoteMicOn(isMicOn);
        setIsRemoteCameraOn(isCameraOn);
      }
    );

    
    // CREATE OFFER


    socket.on("create-offer", async () => {
      try {
        if (
          !peerConnectionRef.current ||
          peerConnectionRef.current.signalingState ===
            "closed"
        ) {
          console.log(
            "Creating new PeerConnection for rejoin..."
          );

          peerConnectionRef.current =
            createPeerConnection();

          if (streamRef.current) {
            streamRef.current
              .getTracks()
              .forEach((track) => {
                peerConnectionRef.current?.addTrack(
                  track,
                  streamRef.current!
                );
              });
          }

          setOtherUserLeft(false);
        }

        if (!peerConnectionRef.current) return;

        const offer =
          await peerConnectionRef.current.createOffer();

        console.log("Offer Created");

        await peerConnectionRef.current.setLocalDescription(
          offer
        );

        console.log("Local Description Set");

        socket.emit("offer", {
          roomId,
          offer,
        });
      } catch (error) {
        console.error(
          "Error creating offer:",
          error
        );
      }
    });

    // RECEIVE OFFER
   

    socket.on("offer", async (offer) => {
      try {
        if (
          !peerConnectionRef.current ||
          peerConnectionRef.current.signalingState ===
            "closed"
        ) {
          console.log(
            "Creating new PeerConnection to receive offer..."
          );

          peerConnectionRef.current =
            createPeerConnection();

          if (streamRef.current) {
            streamRef.current
              .getTracks()
              .forEach((track) => {
                peerConnectionRef.current?.addTrack(
                  track,
                  streamRef.current!
                );
              });
          }
        }

        if (!peerConnectionRef.current) return;

        console.log("Offer Received");

        await peerConnectionRef.current.setRemoteDescription(
          offer
        );

        console.log("Remote Description Set");

        const answer =
          await peerConnectionRef.current.createAnswer();

        console.log("Answer Created");

        await peerConnectionRef.current.setLocalDescription(
          answer
        );

        console.log("Local Description Set");

        socket.emit("answer", {
          roomId,
          answer,
        });
      } catch (error) {
        console.error(
          "Error handling offer:",
          error
        );
      }
    });


    // RECEIVE ANSWER
   

    socket.on("answer", async (answer) => {
      if (!peerConnectionRef.current) return;

      try {
        console.log("Answer Received");

        await peerConnectionRef.current.setRemoteDescription(
          answer
        );

        console.log("Negotiation Complete ✅");
      } catch (error) {
        console.error(
          "Error handling answer:",
          error
        );
      }
    });

   
    // RECEIVE ICE CANDIDATE
   

    socket.on("ice-candidate", async (candidate) => {
      if (!peerConnectionRef.current) return;

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );

        console.log("ICE Candidate Added");
      } catch (error) {
        console.error(
          "Error adding ICE candidate:",
          error
        );
      }
    });

  
    // OTHER USER LEFT
   
socket.on("user-left", () => {
  console.log("Other user left the call");

  peerConnectionRef.current?.close();

  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = null;
  }

  setOtherUserLeft(true);

  setIsCallActive(false);
  setConnectionState("closed");

  setIsRemoteMicOn(true);
  setIsRemoteCameraOn(true);
});

    
    // CLEANUP
 

    return () => {
      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      peerConnectionRef.current?.close();

      socket.off("waiting");
      socket.off("ready");
      socket.off("room-full");
      socket.off("request-media-state");
      socket.off("media-state");
      socket.off("create-offer");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
  }, [roomId]);


  // TOGGLE MICROPHONE
 

  const handleToggleMic = () => {
    const audioTrack =
      streamRef.current?.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;

    const newMicState = audioTrack.enabled;

    setIsMicOn(newMicState);

    socket.emit("media-state", {
      roomId,
      isMicOn: newMicState,
      isCameraOn:
        streamRef.current?.getVideoTracks()[0]?.enabled ??
        false,
    });

    console.log(
      newMicState
        ? "🎤 Microphone Enabled"
        : "🔇 Microphone Disabled"
    );
  };

  
  // TOGGLE CAMERA
  

  const handleToggleCamera = () => {
    const videoTrack =
      streamRef.current?.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;

    const newCameraState = videoTrack.enabled;

    setIsCameraOn(newCameraState);

    socket.emit("media-state", {
      roomId,
      isMicOn:
        streamRef.current?.getAudioTracks()[0]?.enabled ??
        false,
      isCameraOn: newCameraState,
    });

    console.log(
      newCameraState
        ? "📹 Camera Enabled"
        : "📷 Camera Disabled"
    );
  };

 
  // SCREEN SHARING
const stopScreenSharing = async () => {
  const peerConnection = peerConnectionRef.current;

  if (!peerConnection) return;

  const videoSender = peerConnection
    .getSenders()
    .find((sender) => sender.track?.kind === "video");

  const cameraTrack =
    streamRef.current?.getVideoTracks()[0];

  if (!videoSender || !cameraTrack) return;

  try {
    // Restore camera first
    await videoSender.replaceTrack(cameraTrack);

    // Stop screen capture
    screenStreamRef.current
      ?.getTracks()
      .forEach((track) => track.stop());

    screenStreamRef.current = null;

    setIsScreenSharing(false);

    console.log("📹 Camera restored");
    console.log("🛑 Screen sharing stopped");
  } catch (error) {
    console.error(
      "Error stopping screen sharing:",
      error
    );
  }
};

  const handleShareScreen = async () => {
  // STOP
  if (isScreenSharing) {
    await stopScreenSharing();
    return;
  }

  // START
  try {
    const screenStream =
      await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

    const screenTrack =
      screenStream.getVideoTracks()[0];

    if (!screenTrack) {
      screenStream.getTracks().forEach((track) => {
        track.stop();
      });

      return;
    }

    const videoSender =
      peerConnectionRef.current
        ?.getSenders()
        .find(
          (sender) => sender.track?.kind === "video"
        );

    if (!videoSender) {
      screenStream.getTracks().forEach((track) => {
        track.stop();
      });

      return;
    }

    // Store screen stream
    screenStreamRef.current = screenStream;

    // Replace camera with screen
    await videoSender.replaceTrack(screenTrack);

    setIsScreenSharing(true);

    console.log("🖥️ Screen sharing started");

    // Browser's native "Stop sharing"
    screenTrack.onended = async () => {
      console.log("🛑 Browser stopped screen sharing");

      await stopScreenSharing();
    };
  } catch (error) {
    console.error(
      "Error sharing screen:",
      error
    );
  }
};
 
  // LEAVE CALL
 

  const handleLeaveCall = () => {
    streamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    screenStreamRef.current
      ?.getTracks()
      .forEach((track) => {
        track.stop();
      });

    peerConnectionRef.current?.close();

    socket.emit("leave-room", roomId);

    console.log("Call ended");

    router.push("/");
  };

return (
  <main className="relative min-h-screen overflow-x-hidden bg-[#0A0D12] p-4 md:p-6">

    {/* Ambient background */}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(45,212,191,0.08),transparent)]" />

    {/* CONNECTION STATUS */}
    <div className="relative z-10 mb-8 flex flex-col items-center gap-2">

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 backdrop-blur-sm">

        {isCallActive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>

            <span className="text-sm text-white/60">
              Connection:
            </span>

            <span className="text-sm font-semibold text-teal-400">
              {connectionState}
            </span>
          </>
        ) : otherUserLeft ? (
          <>
            <span className="h-2 w-2 rounded-full bg-red-400" />

            <span className="text-sm font-semibold text-red-400">
              Call ended
            </span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-white/30" />

            <span className="text-sm text-white/60">
              Connection:
            </span>

            <span className="text-sm font-semibold text-white/80">
              {connectionState}
            </span>
          </>
        )}

      </div>

      <div className="font-mono text-2xl font-semibold tabular-nums text-white/90">
        <CallTimer isConnected={isCallActive} />
      </div>

    </div>


    {/* MAIN APP AREA */}
    <div className="relative z-10 mx-auto w-full max-w-[1600px]">

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">


        {/* LEFT SIDE */}
        <div className="flex min-w-0 flex-col gap-5">


          {/* VIDEOS */}
          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">


            {/* LOCAL VIDEO */}
            <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1319]">

              <LocalVideo videoRef={videoRef} />

              {!isCameraOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1319] text-white">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/20 to-teal-600/10 text-3xl ring-1 ring-white/10">
                    👤
                  </div>

                  <h2 className="mt-4 text-sm font-medium text-white/60">
                    Camera Off
                  </h2>

                </div>
              )}

              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">

                <span>
                  🎤 {isMicOn ? "Mic On" : "Mic Off"}
                </span>

                <span className="text-white/20">
                  •
                </span>

                <span>
                  📹 {isCameraOn ? "Camera On" : "Camera Off"}
                </span>

              </div>

            </div>


            {/* REMOTE VIDEO */}
            <div className="relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1319]">

              <RemoteVideo videoRef={remoteVideoRef} />


              {/* WAITING */}
              {!isCallActive && !otherUserLeft && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1319] text-white">

                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-400/10 text-3xl ring-1 ring-teal-400/20">
                    👥
                  </div>

                  <h2 className="mt-5 text-xl font-semibold">
                    Waiting for someone to join
                  </h2>

                  <p className="mt-2 max-w-sm text-center text-sm text-white/40">
                    Share this room with someone to start the call.
                  </p>

                  <div className="mt-5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50">
                    Room:{" "}

                    <span className="font-semibold text-white/80">
                      {roomId}
                    </span>
                  </div>

                </div>
              )}


              {/* REMOTE CAMERA OFF */}
              {isCallActive &&
                !otherUserLeft &&
                !isRemoteCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1319] text-white">

                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/20 to-teal-600/10 text-3xl ring-1 ring-white/10">
                      👤
                    </div>

                    <h2 className="mt-4 text-sm font-medium text-white/60">
                      Camera Off
                    </h2>

                  </div>
                )}


              {/* USER LEFT */}
              {otherUserLeft && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F1319] text-white">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-400/10 text-2xl ring-1 ring-red-400/20">
                    📵
                  </div>

                  <h2 className="mt-4 text-xl font-semibold">
                    User left the call
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    The call has ended
                  </p>

                  <button
                    onClick={() => router.push("/")}
                    className="mt-6 rounded-full bg-teal-400 px-5 py-2 text-sm font-semibold text-[#0A0D12] transition hover:bg-teal-300"
                  >
                    Back to Home
                  </button>

                </div>
              )}


              {/* REMOTE STATUS */}
              {isCallActive && !otherUserLeft && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">

                  <span>
                    🎤 {isRemoteMicOn ? "Mic On" : "Mic Off"}
                  </span>

                  <span className="text-white/20">
                    •
                  </span>

                  <span>
                    📹{" "}
                    {isRemoteCameraOn
                      ? "Camera On"
                      : "Camera Off"}
                  </span>

                </div>
              )}

            </div>

          </div>


          {/* CONTROLS */}
          {isCallActive && (
            <div className="flex justify-center">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">

                <CallControls
                  isMicOn={isMicOn}
                  isCameraOn={isCameraOn}
                  isScreenSharing={isScreenSharing}
                  onToggleMic={handleToggleMic}
                  onToggleCamera={handleToggleCamera}
                  onShareScreen={handleShareScreen}
                  onLeaveCall={handleLeaveCall}
                />

              </div>

            </div>
          )}

        </div>


        {/* CHAT */}
        {isCallActive && (
          <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0F1319] xl:h-[600px]">

            <ChatPanel roomId={roomId} />

          </div>
        )}

      </div>

    </div>

  </main>
);
}