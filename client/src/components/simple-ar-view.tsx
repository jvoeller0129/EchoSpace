import { useRef, useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleARViewProps {
  onClose: () => void;
  fragments?: any[];
  currentLocation?: { lat: number; lng: number } | null;
}

export function SimpleARView({ onClose, fragments = [], currentLocation }: SimpleARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  const startCamera = async () => {
    console.log("=== SIMPLE AR VIEW START ===");
    setError(null);
    
    try {
      // Stop any existing streams first
      if (videoRef.current?.srcObject) {
        const existingStream = videoRef.current.srcObject as MediaStream;
        existingStream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log("Stopped existing camera stream");
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported");
      }

      console.log("Requesting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      });

      console.log("Camera stream obtained:", stream.getTracks().length, "tracks");
      console.log("Setting AR interface to active...");
      setIsActive(true);
      
      if (videoRef.current) {
        const video = videoRef.current;
        console.log("Setting up video element");
        
        // Clear any existing source
        video.srcObject = null;
        
        // Set video properties before assigning stream
        video.muted = true;
        video.autoplay = true;
        video.playsInline = true;
        video.controls = false;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        
        console.log("Assigning stream to video element");
        video.srcObject = stream;
        
        console.log("Video element setup complete");
        
        // Update debug info function
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

        // Initial debug update
        updateDebug();
        
        // Set up event listeners
        video.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          updateDebug();
        };
        
        video.oncanplay = () => {
          console.log("Video can play");
          updateDebug();
        };
        
        video.onplay = () => {
          console.log("Video started playing");
          updateDebug();
        };
        
        // Try to force video play
        setTimeout(() => {
          if (video.paused) {
            video.play().then(() => {
              console.log("Video play successful after delay");
            }).catch(e => {
              console.log("Video play failed:", e.message);
            });
          }
        }, 500);
        
        // Regular debug updates
        const debugInterval = setInterval(updateDebug, 1000);
        
        // Cleanup interval on component unmount
        setTimeout(() => clearInterval(debugInterval), 30000);
      }

    } catch (err) {
      console.error("Camera error:", err);
      const errorMsg = err instanceof Error ? err.message : "Camera access failed";
      setError(errorMsg);
      console.log("Full error details:", err);
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera...");
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log("Stopped track:", track.kind, track.label);
      });
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setError(null);
    setDebugInfo({});
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

  console.log("Rendering AR view - isActive:", isActive);
  
  return (
    <div className="fixed inset-0 bg-black z-50" style={{ zIndex: 9999 }}>
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
        <div className="bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-lg shadow-lg">
          🎥 CAMERA WORKING
        </div>
        <button
          onClick={stopCamera}
          className="bg-red-500 text-white p-3 rounded-full shadow-lg"
        >
          <X className="w-8 h-8" />
        </button>
      </div>
      
      {/* Fragment discovery info */}
      <div className="absolute top-20 left-4 right-4 text-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-gray-800">
            🔍 Looking for story fragments...
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {currentLocation ? `Found ${fragments.length} fragments nearby` : 'Enable GPS to discover fragments'}
          </p>
        </div>
      </div>
      
      {/* Center crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-8 h-8 border-2 border-white rounded-full opacity-50"></div>
        <div className="absolute w-4 h-0.5 bg-white opacity-50"></div>
        <div className="absolute w-0.5 h-4 bg-white opacity-50"></div>
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