import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Fragment, FragmentWithDistance } from "@shared/schema";
import MapContainer from "@/components/map-container";
import DiscoveryPanel from "@/components/discovery-panel";
import FragmentDetailPanel from "@/components/fragment-detail-panel";
import CreateFragmentModal from "@/components/create-fragment-modal";
import MobileTabBar from "@/components/mobile-tab-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, User, Navigation } from "lucide-react";

export default function Home() {
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("map");
  const isMobile = useIsMobile();

  // Fetch fragments based on current filters
  const { data: fragments = [], isLoading, refetch } = useQuery<Fragment[]>({
    queryKey: ["/api/fragments", searchQuery, selectedCategory],
    enabled: true,
  });

  // Request geolocation permission and get current position
  useEffect(() => {
    if (locationEnabled && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationEnabled(false);
        }
      );
    }
  }, [locationEnabled]);

  const handleFragmentSelect = (fragment: Fragment) => {
    setSelectedFragment(fragment);
    setIsDetailPanelOpen(true);
  };

  const handleLocationToggle = () => {
    if (!locationEnabled) {
      setLocationEnabled(true);
    } else {
      setLocationEnabled(false);
      setCurrentLocation(null);
    }
  };

  const handleCreateFragment = () => {
    setIsCreateModalOpen(true);
  };

  const handleFragmentCreated = () => {
    setIsCreateModalOpen(false);
    refetch();
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
  };

  const fragmentsWithDistance = currentLocation
    ? fragments.map((fragment) => ({
        ...fragment,
        distance: calculateDistance(currentLocation.lat, currentLocation.lng, fragment.latitude, fragment.longitude),
      }))
    : fragments.map(fragment => ({ ...fragment, distance: undefined }));

  const nearbyFragments = currentLocation
    ? fragmentsWithDistance.filter((f) => f.distance !== undefined && f.distance <= 500) // Within 500m
    : [];

  return (
    <div className="h-screen flex flex-col bg-echo-light" data-testid="home-page">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-50 relative">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-echo-blue to-echo-teal rounded-lg flex items-center justify-center">
              <MapPin className="text-white w-4 h-4" />
            </div>
            <h1 className="text-xl font-semibold text-echo-gray">Echo Space</h1>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLocationToggle}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                locationEnabled
                  ? "bg-echo-teal text-white"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              }`}
              data-testid="button-location-toggle"
            >
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">
                {locationEnabled ? "GPS Active" : "Enable GPS"}
              </span>
            </button>

            <button
              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
              data-testid="button-profile"
            >
              <User className="text-gray-600 w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {/* Map Container */}
        <MapContainer
          fragments={fragmentsWithDistance}
          currentLocation={currentLocation}
          onFragmentSelect={handleFragmentSelect}
          selectedFragment={selectedFragment}
        />

        {/* Discovery Panel - Hidden on mobile when not on discovery tab */}
        {(!isMobile || activeTab === "discover") && (
          <DiscoveryPanel
            fragments={fragmentsWithDistance}
            onFragmentSelect={handleFragmentSelect}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            isLoading={isLoading}
          />
        )}

        {/* Status Indicator - Desktop only */}
        {!isMobile && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 space-y-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${locationEnabled ? "bg-green-500" : "bg-gray-400"}`} />
                <span className="text-xs font-medium text-echo-gray">
                  {locationEnabled ? "GPS Active" : "GPS Disabled"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="text-echo-teal w-3 h-3" />
                <span className="text-xs text-gray-600" data-testid="text-nearby-count">
                  {nearbyFragments.length} fragments nearby
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-echo-amber">●</span>
                <span className="text-xs text-gray-600" data-testid="text-total-count">
                  {fragments.length} discovered
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Create Fragment FAB */}
        <button
          onClick={handleCreateFragment}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-echo-blue to-echo-teal text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-30"
          data-testid="button-create-fragment"
        >
          <span className="text-lg">+</span>
        </button>
      </main>

      {/* Fragment Detail Panel */}
      <FragmentDetailPanel
        fragment={selectedFragment}
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false);
          setSelectedFragment(null);
        }}
        onUpdate={refetch}
      />

      {/* Create Fragment Modal */}
      <CreateFragmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onFragmentCreated={handleFragmentCreated}
        currentLocation={currentLocation}
      />

      {/* Mobile Tab Bar */}
      {isMobile && (
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </div>
  );
}
