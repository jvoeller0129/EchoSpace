import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Plus } from "lucide-react";
import type { Fragment } from "@shared/schema";

type FragmentWithAR = Fragment & {
  distance: number;
  bearing: number;
};

interface ARViewProps {
  fragments: Fragment[];
  currentLocation: { lat: number; lng: number } | null;
  onFragmentSelect: (fragment: Fragment) => void;
  onCreateFragment: (location: { lat: number; lng: number }) => void;
}

export { ARView };

function ARView({ 
  fragments, 
  currentLocation, 
  onFragmentSelect, 
  onCreateFragment 
}: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [nearbyFragments, setNearbyFragments] = useState<FragmentWithAR[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Calculate bearing to fragment
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return (Math.atan2(y, x) * 180/Math.PI + 360) % 360;
  };

  // Start AR camera
  const startAR = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not supported on this device/browser');
        return;
      }

      console.log('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      });
      
      console.log('Camera access granted');
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set all video properties before assigning stream
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.controls = false;
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('playsinline', 'true');
        
        console.log('Assigning camera stream to video element');
        console.log('Video element exists:', !!video);
        console.log('Stream tracks:', stream.getTracks().length);
        video.srcObject = stream;
        console.log('Stream assigned to video element');
        
        // Multiple approaches to start video playback
        const tryPlayVideo = async () => {
          try {
            console.log('Attempting to play video...');
            await video.play();
            console.log('Video playback successful');
            setIsARActive(true);
            return true;
          } catch (error) {
            console.log('Video play attempt failed:', error);
            return false;
          }
        };
        
        // Try immediate play
        tryPlayVideo();
        
        // Also try on loadedmetadata event
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          tryPlayVideo();
        };
        
        // Try on canplay event
        video.oncanplay = () => {
          console.log('Video can play');
          tryPlayVideo();
        };
        
        // Force AR active regardless of video play success
        console.log('Setting AR active - camera stream available');
        setIsARActive(true);
        
        // Debug video element state
        console.log('Video element debug:');
        console.log('- readyState:', video.readyState);
        console.log('- paused:', video.paused);
        console.log('- muted:', video.muted);
        console.log('- autoplay:', video.autoplay);
        console.log('- playsInline:', video.playsInline);
        
        // Final fallback with longer delay
        setTimeout(() => {
          console.log('Final AR activation check');
          console.log('Video state after delay:', {
            readyState: video.readyState,
            paused: video.paused,
            hasStream: !!video.srcObject,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          if (video.srcObject) {
            console.log('Stream exists, ensuring AR active');
            setIsARActive(true);
          }
        }, 1000);
      }

      // Setup device orientation
      setupDeviceOrientation();
      
    } catch (error) {
      console.error('Camera access error:', error);
      
      let errorMessage = 'Unable to access camera. ';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please grant camera permission and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera not supported on this browser.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsARActive(false);
    }
  };

  // Setup device orientation with better error handling
  const setupDeviceOrientation = async () => {
    try {
      // Request device orientation permission on iOS
      if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          console.log('Device orientation permission granted');
        } else {
          console.warn('Device orientation permission denied');
        }
      } else {
        // Android and other devices
        window.addEventListener('deviceorientation', handleOrientation);
        console.log('Device orientation listener added');
      }
    } catch (error) {
      console.warn('Device orientation setup failed:', error);
      // Continue without device orientation - AR will still work with manual positioning
    }
  };

  // Stop AR camera
  const stopAR = () => {
    console.log('Stopping AR camera...');
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped camera track:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    setIsARActive(false);
    setIsCreating(false);
    setError(null);
    window.removeEventListener('deviceorientation', handleOrientation);
    console.log('AR camera stopped');
  };

  // Handle device orientation changes
  const handleOrientation = (event: DeviceOrientationEvent) => {
    setDeviceOrientation({
      alpha: event.alpha || 0, // Compass heading
      beta: event.beta || 0,   // Tilt front/back
      gamma: event.gamma || 0  // Tilt left/right
    });
  };

  // Update nearby fragments based on location and orientation
  useEffect(() => {
    if (!currentLocation || !isARActive) return;

    const nearby = fragments.filter(fragment => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        fragment.latitude,
        fragment.longitude
      );
      return distance <= 100; // Show fragments within 100 meters
    }).map(fragment => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        fragment.latitude,
        fragment.longitude
      );
      const bearing = calculateBearing(
        currentLocation.lat,
        currentLocation.lng,
        fragment.latitude,
        fragment.longitude
      );
      return { ...fragment, distance, bearing } as FragmentWithAR;
    });

    setNearbyFragments(nearby);
  }, [fragments, currentLocation, isARActive, deviceOrientation]);

  // Render AR overlays
  const renderAROverlays = () => {
    if (!currentLocation || !isARActive) return null;

    return nearbyFragments.map((fragment) => {
      // Calculate relative angle to fragment
      const relativeAngle = (fragment.bearing - deviceOrientation.alpha + 360) % 360;
      
      // Only show fragments in front of user (±60 degrees)
      if (relativeAngle > 60 && relativeAngle < 300) return null;

      // Calculate position on screen
      const centerX = 50; // Center of screen
      const offsetX = centerX + (relativeAngle > 180 ? relativeAngle - 360 : relativeAngle) * 2;
      
      // Calculate vertical position based on distance
      const verticalOffset = Math.max(0, 60 - (fragment.distance / 2));

      const categoryColors = {
        story: "#F59E0B",
        memory: "#0F766E", 
        lore: "#1E3A8A",
        mystery: "#7C3AED",
        history: "#DC2626",
      };

      const color = categoryColors[fragment.category as keyof typeof categoryColors] || "#6B7280";

      return (
        <div
          key={fragment.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{
            left: `${Math.max(10, Math.min(90, offsetX))}%`,
            top: `${verticalOffset}%`,
          }}
          onClick={() => onFragmentSelect(fragment)}
        >
          <div 
            className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg border-2 max-w-xs"
            style={{ borderColor: color }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-semibold text-gray-800">
                {fragment.title}
              </span>
            </div>
            <div className="text-xs text-gray-600 mb-2">
              {Math.round(fragment.distance)}m away
            </div>
            <div className="text-xs text-gray-700 line-clamp-2">
              {fragment.content.substring(0, 80)}...
            </div>
          </div>
        </div>
      );
    });
  };

  // Handle create fragment at center of screen
  const handleCreateHere = () => {
    if (currentLocation) {
      onCreateFragment(currentLocation);
      setIsCreating(false);
    }
  };

  const handleStartAR = async () => {
    setIsLoading(true);
    setError(null);
    console.log('Starting AR with loading state...');
    try {
      await startAR();
    } catch (error) {
      console.error('AR start failed:', error);
      setError('Failed to start AR camera');
    }
    setIsLoading(false);
  };

  if (!isARActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">AR Fragment Discovery</h2>
        <p className="text-gray-600 text-center mb-6">
          Point your camera at the world to discover nearby story fragments in augmented reality
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 max-w-sm">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {/* Debug status */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 max-w-sm text-center">
          <p className="text-blue-700 text-sm">
            Status: {isLoading ? 'Loading...' : isARActive ? 'Camera Active' : 'Ready to start'}
          </p>
          <p className="text-blue-600 text-xs mt-1">
            AR State: {isARActive.toString()} | Loading: {isLoading.toString()}
          </p>
        </div>
        
        <Button 
          onClick={handleStartAR} 
          size="lg" 
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <Camera className="w-5 h-5" />
          {isLoading ? 'Starting Camera...' : 'Start AR View'}
        </Button>
        
        <div className="mt-6 text-xs text-gray-500 text-center max-w-xs">
          <p>This requires camera permission. Make sure to allow camera access when prompted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover bg-black"
        playsInline={true}
        autoPlay={true}
        muted={true}
        controls={false}
        webkit-playsinline="true"
        style={{ 
          transform: 'scaleX(-1)',
          objectFit: 'cover',
          width: '100%',
          height: '100%'
        }}
      />
      
      {/* Debug overlay - More visible */}
      <div className="absolute top-4 left-4 bg-green-500 text-white text-sm font-bold p-3 rounded-lg shadow-lg z-50">
        📹 AR CAMERA ACTIVE
      </div>
      
      {/* Video status overlay */}
      <div className="absolute top-4 right-4 bg-black/70 text-white text-xs p-2 rounded z-40">
        <div>Ready: {videoRef.current?.readyState || 0}</div>
        <div>Paused: {videoRef.current?.paused ? 'Yes' : 'No'}</div>
        <div>Stream: {videoRef.current?.srcObject ? 'Yes' : 'No'}</div>
        <div>Size: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</div>
        <div>Playing: {videoRef.current && !videoRef.current.paused && videoRef.current.readyState > 2 ? 'Yes' : 'No'}</div>
      </div>
      
      {/* Fallback if video doesn't show - debugging */}
      {!videoRef.current?.srcObject && (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div>Initializing Camera...</div>
          </div>
        </div>
      )}
      
      {/* AR Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="relative w-full h-full">
          {renderAROverlays()}
          
          {/* Crosshair for creation mode */}
          {isCreating && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <div className="w-8 h-8 border-2 border-white rounded-full bg-black/20 backdrop-blur-sm" />
                <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded px-2 py-1">
                <span className="text-xs text-gray-800">Tap to place fragment here</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* UI Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
        <Button variant="outline" onClick={stopAR} className="bg-white/90 backdrop-blur-sm">
          Exit AR
        </Button>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
          <div className="text-xs text-gray-600">
            {nearbyFragments.length} fragment{nearbyFragments.length !== 1 ? 's' : ''} nearby
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4 pointer-events-auto">
        {!isCreating ? (
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Drop Echo Here
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsCreating(false)}
              className="bg-white/90 backdrop-blur-sm"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateHere}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Place Fragment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}