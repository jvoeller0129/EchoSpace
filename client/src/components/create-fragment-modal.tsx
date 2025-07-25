import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, MapPin, Upload } from "lucide-react";
import type { InsertFragment } from "@shared/schema";
import { insertFragmentSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateFragmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFragmentCreated: () => void;
  currentLocation: { lat: number; lng: number } | null;
}

const createFragmentSchema = insertFragmentSchema.extend({
  tags: z.string().optional(),
});

type CreateFragmentForm = z.infer<typeof createFragmentSchema>;

const categories = [
  { value: "story", label: "Story" },
  { value: "memory", label: "Memory" },
  { value: "lore", label: "Lore" },
  { value: "mystery", label: "Mystery" },
  { value: "history", label: "History" },
];

export default function CreateFragmentModal({
  isOpen,
  onClose,
  onFragmentCreated,
  currentLocation,
}: CreateFragmentModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateFragmentForm>({
    resolver: zodResolver(createFragmentSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      latitude: currentLocation?.lat || 40.7128,
      longitude: currentLocation?.lng || -74.0060,
      locationName: "",
      author: "",
      imageUrl: "",
      tags: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFragment) => {
      return apiRequest("POST", "/api/fragments", data);
    },
    onSuccess: () => {
      toast({
        title: "Fragment created!",
        description: "Your echo has been added to the world.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fragments"] });
      onFragmentCreated();
      form.reset();
      setImageFile(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create fragment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFragmentForm) => {
    const fragmentData: InsertFragment = {
      ...data,
      latitude: currentLocation?.lat || 40.7128,
      longitude: currentLocation?.lng || -74.0060,
      locationName: data.locationName || "Unknown Location",
      author: data.author || "Anonymous",
      tags: data.tags ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [],
      // For now, we'll use a placeholder image URL if no file is uploaded
      imageUrl: imageFile ? "https://via.placeholder.com/800x400" : "",
    };

    createMutation.mutate(fragmentData);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      toast({
        title: "Image selected",
        description: `${file.name} selected for upload.`,
      });
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° W`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden" data-testid="create-fragment-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Create Echo Fragment</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Location Display */}
            {currentLocation && (
              <div className="bg-echo-light p-3 rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2">
                  <MapPin className="text-echo-teal w-4 h-4" />
                  <span className="text-sm font-medium text-echo-gray" data-testid="text-current-location">
                    Current Location
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1" data-testid="text-coordinates">
                  {formatCoordinates(currentLocation.lat, currentLocation.lng)}
                </p>
              </div>
            )}

            {/* Fragment Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fragment Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Give your fragment a memorable name..."
                      {...field}
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location Name */}
            <FormField
              control={form.control}
              name="locationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Describe this place..."
                      {...field}
                      data-testid="input-location-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Author */}
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="How should we credit you?"
                      {...field}
                      data-testid="input-author"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fragment Content */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Story</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={6}
                      placeholder="Share the story, memory, or lore connected to this place..."
                      {...field}
                      data-testid="textarea-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Photo (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-echo-teal transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  data-testid="input-image"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {imageFile ? imageFile.name : "Click to upload or drag an image here"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Max 5MB, JPG or PNG</p>
                </label>
              </div>
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Add tags separated by commas..."
                      {...field}
                      data-testid="input-tags"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-gray-500">Help others discover your fragment with relevant tags</p>
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 bg-gradient-to-r from-echo-blue to-echo-teal hover:opacity-90"
                data-testid="button-create"
              >
                {createMutation.isPending ? "Creating..." : "Create Fragment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
