import { useRef, useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleARViewProps {
  onClose: () => void;
}

export function SimpleARView({ onClose }: SimpleARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const startCamera = async () => {
    console.log("=== SIMPLE AR VIEW START ===");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported");
      }

      console.log("Requesting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 }
        }
      });

      console.log("Camera stream obtained:", stream.getTracks().length, "tracks");
      
      if (videoRef.current) {
        const video = videoRef.current;
        console.log("Assigning stream to video element");
        
        // Set video properties
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', 'true');
        
        // Assign stream
        video.srcObject = stream;
        
        // Force play
        try {
          await video.play();
          console.log("Video playing successfully");
          setIsActive(true);
        } catch (playError) {
          console.error("Video play failed:", playError);
          // Still set active since we have the stream
          setIsActive(true);
        }

        // Update debug info
        const updateDebug = () => {
          setDebugInfo({
            readyState: video.readyState,
            paused: video.paused,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            hasStream: !!video.srcObject,
            tracks: stream.getTracks().length
          });
        };

        updateDebug();
        video.onloadedmetadata = updateDebug;
        video.oncanplay = updateDebug;
        
        setInterval(updateDebug, 1000);
      }

    } catch (err) {
      console.error("Camera error:", err);
      setError(err instanceof Error ? err.message : "Camera access failed");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    onClose();
  };

  if (!isActive) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-200 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
        
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-4">Simple AR Test</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-300 rounded p-3 mb-4 max-w-sm">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <Button onClick={startCamera} size="lg">
          <Camera className="w-5 h-5 mr-2" />
          Test Camera
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="bg-green-500 text-white px-3 py-2 rounded font-bold">
          🎥 CAMERA ACTIVE
        </div>
        <button
          onClick={stopCamera}
          className="bg-red-500 text-white p-2 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs p-3 rounded max-w-xs">
        <div>Ready: {debugInfo.readyState || 0}</div>
        <div>Size: {debugInfo.videoWidth || 0}x{debugInfo.videoHeight || 0}</div>
        <div>Paused: {debugInfo.paused ? 'Yes' : 'No'}</div>
        <div>Stream: {debugInfo.hasStream ? 'Yes' : 'No'}</div>
        <div>Tracks: {debugInfo.tracks || 0}</div>
      </div>
    </div>
  );
}