"use client"

interface CallControlsProps{
    isMicOn: boolean,
    isCameraOn: boolean,
     isScreenSharing: boolean;
     onToggleMic: ()=> void,
     onToggleCamera: ()=> void,
     onShareScreen: ()=> void,
     onLeaveCall: ()=> void,
}

export default function CallControls ({
     isMicOn,
     isCameraOn,
       isScreenSharing,
    onToggleMic,
  onToggleCamera,
  onShareScreen,
  onLeaveCall,
}: CallControlsProps){
    return (
         <div className="mt-8 flex items-center justify-center gap-4">
      <button
        onClick={onToggleMic}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {isMicOn ? "🎤 Mute" : "🔇 Unmute"}
      </button>

      <button
        onClick={onToggleCamera}
        className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
      >
    {isCameraOn ? "📹 Camera Off" : "📷 Camera On"}
      </button>

  <button
  onClick={onShareScreen}
  className="rounded-lg bg-yellow-500 px-4 py-2 text-white  hover:bg-yellow-600"
>
  {isScreenSharing ? "🛑 Stop Sharing" : "🖥️ Share Screen"}
</button>

      <button
        onClick={onLeaveCall}
        className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
      >
        📞 Leave
      </button>
    </div>
    )
}