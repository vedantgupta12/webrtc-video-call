import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://webrtc-video-call-theta.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Client Connected");
  console.log(`Socket ID: ${socket.id}`);

  // JOIN ROOM
 

  socket.on("join-room", (roomId: string) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const roomSize = room?.size ?? 0;

    if (roomSize >= 2) {
      socket.emit("room-full");
      return;
    }

    socket.join(roomId);

    console.log(`${socket.id} joined room ${roomId}`);

    const updatedRoom = io.sockets.adapter.rooms.get(roomId);

    // First user
    if (updatedRoom?.size === 1) {
      socket.emit("waiting");
    }

    // Second user
    if (updatedRoom?.size === 2) {
      const sockets = Array.from(updatedRoom) as string[];

      const callerSocketId = sockets[0]!;

      // Ask caller to create offer
      io.to(callerSocketId).emit("create-offer");

      // Tell both users room is ready
      io.to(roomId).emit("ready");

      // Ask both users to send their current mic/camera state
      io.to(roomId).emit("request-media-state");
    }
  });


  // OFFER


  socket.on(
    "offer",
    ({
      roomId,
      offer,
    }: {
      roomId: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      socket.to(roomId).emit("offer", offer);

      console.log("Offer Forwarded");
    }
  );

  // ANSWER


  socket.on(
    "answer",
    ({
      roomId,
      answer,
    }: {
      roomId: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      socket.to(roomId).emit("answer", answer);

      console.log("Answer Forwarded");
    }
  );


  // ICE CANDIDATE


  socket.on(
    "ice-candidate",
    ({
      roomId,
      candidate,
    }: {
      roomId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      socket.to(roomId).emit("ice-candidate", candidate);

      console.log("ICE Candidate Forwarded");
    }
  );

  
  // MEDIA STATE


  socket.on(
    "media-state",
    ({
      roomId,
      isMicOn,
      isCameraOn,
    }: {
      roomId: string;
      isMicOn: boolean;
      isCameraOn: boolean;
    }) => {
      socket.to(roomId).emit("media-state", {
        isMicOn,
        isCameraOn,
      });

      console.log(
        `Media State → Mic: ${isMicOn}, Camera: ${isCameraOn}`
      );
    }
  );

  
  // LEAVE ROOM
  

  socket.on("leave-room", (roomId: string) => {
    socket.leave(roomId);

    console.log(`${socket.id} left room ${roomId}`);

    socket.to(roomId).emit("user-left");
  });

  
  // UNEXPECTED DISCONNECT


  socket.on("disconnecting", () => {
    console.log(`Client Disconnecting: ${socket.id}`);

    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      socket.to(roomId).emit("user-left");
    }
  });


  // SEND MESSAGE  

  socket.on(
  "send-message",
  ({
    roomId,
    message,
  }: {
    roomId: string;
    message: string;
  }) => {
    socket.to(roomId).emit("receive-message", {
      message,
    });

    console.log(`Message sent in room ${roomId}: ${message}`);
  }
);

  // DISCONNECT
  

  socket.on("disconnect", () => {
    console.log(`Client Disconnected: ${socket.id}`);
  });
});

const PORT = Number(process.env.PORT) || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});