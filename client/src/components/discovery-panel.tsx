import { Search, BookOpen, Camera, Heart, Eye, Zap } from "lucide-react";
import type { FragmentWithDistance } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiscoveryPanelProps {
  fragments: FragmentWithDistance[];
  onFragmentSelect: (fragment: FragmentWithDistance) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isLoading: boolean;
}

const categoryIcons: Record<string, any> = {
  story: BookOpen,
  memory: Camera,
  lore: Eye,
  mystery: Zap,
  history: Heart,
};

const categories = [
  { value: "", label: "All" },
  { value: "story", label: "Stories" },
  { value: "memory", label: "Memories" },
  { value: "lore", label: "Lore" },
  { value: "mystery", label: "Mystery" },
  { value: "history", label: "History" },
];

export default function DiscoveryPanel({
  fragments,
  onFragmentSelect,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isLoading,
}: DiscoveryPanelProps) {
  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }
    return `${(distance / 1000).toFixed(1)}km away`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      story: "bg-amber-100 text-amber-800",
      memory: "bg-teal-100 text-teal-800",
      lore: "bg-blue-100 text-blue-800",
      mystery: "bg-purple-100 text-purple-800",
      history: "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIconColor = (category: string) => {
    const colors: Record<string, string> = {
      story: "bg-amber-500",
      memory: "bg-teal-500",
      lore: "bg-blue-500",
      mystery: "bg-purple-500",
      history: "bg-red-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 md:right-auto md:w-80" data-testid="discovery-panel">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Search and Filter Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search fragments..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.value
                    ? "bg-echo-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                data-testid={`button-category-${category.value || "all"}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fragment List */}
        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500" data-testid="loading-state">
              Loading fragments...
            </div>
          ) : fragments.length === 0 ? (
            <div className="p-4 text-center text-gray-500" data-testid="empty-state">
              No fragments found
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {fragments.map((fragment) => {
                const IconComponent = categoryIcons[fragment.category] || BookOpen;
                return (
                  <div
                    key={fragment.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => onFragmentSelect(fragment)}
                    data-testid={`fragment-item-${fragment.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryIconColor(
                          fragment.category
                        )}`}
                      >
                        <IconComponent className="text-white w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-echo-gray text-sm" data-testid={`text-title-${fragment.id}`}>
                          {fragment.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1" data-testid={`text-preview-${fragment.id}`}>
                          {fragment.content.substring(0, 100)}...
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="secondary" className={getCategoryColor(fragment.category)}>
                            {fragment.category}
                          </Badge>
                          {fragment.distance !== undefined && (
                            <span className="text-xs text-gray-400" data-testid={`text-distance-${fragment.id}`}>
                              {formatDistance(fragment.distance)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
