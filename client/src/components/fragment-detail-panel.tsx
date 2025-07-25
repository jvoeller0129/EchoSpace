import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Heart, Share, Flag } from "lucide-react";
import type { Fragment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FragmentDetailPanelProps {
  fragment: Fragment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function FragmentDetailPanel({
  fragment,
  isOpen,
  onClose,
  onUpdate,
}: FragmentDetailPanelProps) {
  const [liked, setLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async (fragmentId: string) => {
      return apiRequest("POST", `/api/fragments/${fragmentId}/like`);
    },
    onSuccess: () => {
      setLiked(true);
      queryClient.invalidateQueries({ queryKey: ["/api/fragments"] });
      onUpdate();
      toast({
        title: "Fragment liked!",
        description: "Thank you for your appreciation.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like fragment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (fragment && !liked) {
      likeMutation.mutate(fragment.id);
    }
  };

  const handleShare = () => {
    if (fragment) {
      if (navigator.share) {
        navigator.share({
          title: fragment.title,
          text: fragment.content.substring(0, 200) + "...",
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Fragment link copied to clipboard.",
        });
      }
    }
  };

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep Echo Space safe.",
    });
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

  const formatTimeAgo = (dateString: string) => {
    // For now, return a placeholder since we don't have created dates
    return "Recently added";
  };

  if (!fragment) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-20 transform transition-transform duration-300 ${
        isOpen ? "translate-y-0" : "translate-y-full"
      }`}
      data-testid="fragment-detail-panel"
    >
      <div className="bg-white rounded-t-xl shadow-2xl border-t border-gray-200 max-h-[70vh] overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-echo-amber rounded-lg flex items-center justify-center">
              <span className="text-white text-xs">📖</span>
            </div>
            <div>
              <h2 className="font-semibold text-echo-gray" data-testid="text-fragment-title">
                {fragment.title}
              </h2>
              <p className="text-xs text-gray-500" data-testid="text-fragment-location">
                {fragment.locationName}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 rounded-full p-0"
            data-testid="button-close-panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel Content */}
        <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Fragment Image */}
            {fragment.imageUrl && (
              <img
                src={fragment.imageUrl}
                alt={fragment.title}
                className="w-full h-48 object-cover rounded-lg"
                data-testid="img-fragment"
              />
            )}

            {/* Fragment Content */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge className={getCategoryColor(fragment.category)} data-testid="badge-category">
                  {fragment.category}
                </Badge>
                <span className="text-xs text-gray-400" data-testid="text-created-at">
                  {formatTimeAgo("")}
                </span>
                <span className="text-xs text-gray-400" data-testid="text-author">
                  by {fragment.author}
                </span>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap" data-testid="text-content">
                  {fragment.content}
                </p>
              </div>

              {/* Tags */}
              {fragment.tags && fragment.tags.length > 0 && (
                <div className="flex flex-wrap gap-2" data-testid="fragment-tags">
                  {fragment.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={liked || likeMutation.isPending}
                  className="flex items-center space-x-2"
                  data-testid="button-like"
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
                  <span className="text-sm" data-testid="text-likes">
                    {fragment.likes}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2"
                  data-testid="button-share"
                >
                  <Share className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Share</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReport}
                  className="flex items-center space-x-2"
                  data-testid="button-report"
                >
                  <Flag className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Report</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
