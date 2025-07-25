import { MapPin, List, Compass, User } from "lucide-react";

interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "map", label: "Map", icon: MapPin },
  { id: "fragments", label: "Fragments", icon: List },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "profile", label: "Profile", icon: User },
];

export default function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  return (
    <nav className="bg-white border-t border-gray-200 md:hidden" data-testid="mobile-tab-bar">
      <div className="flex">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex-1 py-3 px-4 text-center group"
              data-testid={`button-tab-${tab.id}`}
            >
              <IconComponent
                className={`text-lg block mx-auto w-5 h-5 ${
                  isActive ? "text-echo-blue" : "text-gray-400"
                }`}
              />
              <span
                className={`text-xs font-medium mt-1 block ${
                  isActive ? "text-echo-blue" : "text-gray-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
