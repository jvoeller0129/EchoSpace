import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MapPin, Plus } from "lucide-react";
import type { Fragment } from "@shared/schema";

interface ARViewProps {
  fragments: Fragment[];
  currentLocation: { lat: number; lng: number } | null;
  onFragmentSelect: (fragment: Fragment) => void;
  onCreateFragment: (location: { lat: number; lng: number }) => void;
}

export function ARView({ 
  fragments, 
  currentLocation, 
  onFragmentSelect, 
  onCreateFragment 
}: ARViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isARActive, setIsARActive] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [nearbyFragments, setNearbyFragments] = useState<Fragment[]>([]);
  const [isCreating, setIsCreating] = useState(false);

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsARActive(true);
      }

      // Request device orientation permission on iOS
      if ('DeviceOrientationEvent' in window && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please ensure you have granted camera permissions.');
    }
  };

  // Stop AR camera
  const stopAR = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsARActive(false);
    setIsCreating(false);
    window.removeEventListener('deviceorientation', handleOrientation);
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
      return { ...fragment, distance, bearing };
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

  if (!isARActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
        <Camera className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">AR Fragment Discovery</h2>
        <p className="text-gray-600 text-center mb-6">
          Point your camera at the world to discover nearby story fragments in augmented reality
        </p>
        <Button onClick={startAR} size="lg" className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Start AR View
        </Button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      
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