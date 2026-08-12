 "use client";

interface CameraOffProps {
  title: string;
}

export default function CameraOff({
  title,
}: CameraOffProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      
      {/* Title */}
      <h2 className="text-xl font-semibold text-white">
        {title}
      </h2>

      {/* Camera Off Area */}
      <div className="flex h-[400px] w-[600px] flex-col items-center justify-center rounded-lg border border-white bg-black text-white">
        <div className="text-6xl">
          👤
        </div>

        <h2 className="mt-4 text-xl font-semibold">
          Camera Off
        </h2>
      </div>

    </div>
  );
}