import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Fragment, FragmentWithDistance } from "@shared/schema";
import MapContainer from "@/components/map-container";
import DiscoveryPanel from "@/components/discovery-panel";
import FragmentDetailPanel from "@/components/fragment-detail-panel";
import CreateFragmentModal from "@/components/create-fragment-modal";
import { ARView } from "@/components/ar-view";
import { SimpleARView } from "@/components/simple-ar-view";
import MobileTabBar from "@/components/mobile-tab-bar";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, User, Navigation, Camera } from "lucide-react";

export default function Home() {
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activeTab, setActiveTab] = useState("map");
  const [showSimpleAR, setShowSimpleAR] = useState(false);
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

            {/* AR Button - Desktop only */}
            {!isMobile && (
              <button
                onClick={() => setShowSimpleAR(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                data-testid="button-ar-view"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Test AR</span>
              </button>
            )}

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
        {/* Map Container - Default view */}
        {(!isMobile || activeTab === "map") && activeTab !== "ar" && (
          <MapContainer
            fragments={fragmentsWithDistance}
            currentLocation={currentLocation}
            onFragmentSelect={handleFragmentSelect}
            selectedFragment={selectedFragment}
          />
        )}

        {/* AR View - Full screen for desktop when AR is active */}
        {activeTab === "ar" && (
          <div className="absolute inset-0 z-20">
            <ARView
              fragments={fragments}
              currentLocation={currentLocation}
              onFragmentSelect={handleFragmentSelect}
              onCreateFragment={(location) => {
                setCurrentLocation(location);
                setIsCreateModalOpen(true);
              }}
            />
          </div>
        )}

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



        {/* Fragments List - Mobile fragments tab */}
        {isMobile && activeTab === "fragments" && (
          <div className="absolute inset-0 z-10 bg-white overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">All Fragments</h2>
              <div className="space-y-3">
                {fragmentsWithDistance.map((fragment) => (
                  <div
                    key={fragment.id}
                    onClick={() => handleFragmentSelect(fragment)}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-800">{fragment.title}</h3>
                      {fragment.distance !== undefined && (
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                          {Math.round(fragment.distance)}m
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {fragment.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        {fragment.category}
                      </span>
                      <span className="text-xs text-gray-500">{fragment.locationName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Profile View - Mobile profile tab */}
        {isMobile && activeTab === "profile" && (
          <div className="absolute inset-0 z-10 bg-white overflow-y-auto">
            <div className="p-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-echo-blue to-echo-teal rounded-full mx-auto mb-3 flex items-center justify-center">
                  <User className="text-white w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">Explorer Profile</h2>
                <p className="text-gray-600 text-sm">Story Fragment Discoverer</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">Discovery Stats</h3>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-echo-blue">{fragments.length}</div>
                      <div className="text-xs text-gray-600">Fragments Found</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-echo-teal">{nearbyFragments.length}</div>
                      <div className="text-xs text-gray-600">Nearby</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">Recent Activity</h3>
                  <p className="text-sm text-gray-600">Your latest discoveries and contributions will appear here.</p>
                </div>
              </div>
            </div>
          </div>
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

      {/* Tab Bar - Always visible for AR access */}
      <MobileTabBar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onARTest={() => setShowSimpleAR(true)}
      />

      {/* Simple AR View Test */}
      {showSimpleAR && (
        <SimpleARView 
          onClose={() => setShowSimpleAR(false)}
          fragments={fragments}
          currentLocation={currentLocation}
        />
      )}
    </div>
  );
}
