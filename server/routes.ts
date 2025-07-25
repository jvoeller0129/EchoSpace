import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFragmentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all fragments
  app.get("/api/fragments", async (req, res) => {
    try {
      const { search, category, lat, lng, radius } = req.query;
      
      let fragments;
      
      if (lat && lng && radius) {
        // Get fragments by location
        fragments = await storage.getFragmentsByLocation(
          parseFloat(lat as string),
          parseFloat(lng as string), 
          parseFloat(radius as string)
        );
      } else if (search || category) {
        // Search fragments
        fragments = await storage.searchFragments(
          search as string || "",
          category as string
        );
      } else {
        // Get all fragments
        fragments = await storage.getFragments();
      }
      
      res.json(fragments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fragments" });
    }
  });

  // Get single fragment
  app.get("/api/fragments/:id", async (req, res) => {
    try {
      const fragment = await storage.getFragment(req.params.id);
      if (!fragment) {
        return res.status(404).json({ message: "Fragment not found" });
      }
      res.json(fragment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fragment" });
    }
  });

  // Create new fragment
  app.post("/api/fragments", async (req, res) => {
    try {
      const validatedData = insertFragmentSchema.parse(req.body);
      const fragment = await storage.createFragment(validatedData);
      res.status(201).json(fragment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid fragment data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create fragment" });
    }
  });

  // Update fragment (for likes, etc.)
  app.patch("/api/fragments/:id", async (req, res) => {
    try {
      const fragment = await storage.updateFragment(req.params.id, req.body);
      if (!fragment) {
        return res.status(404).json({ message: "Fragment not found" });
      }
      res.json(fragment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update fragment" });
    }
  });

  // Delete fragment
  app.delete("/api/fragments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFragment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Fragment not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete fragment" });
    }
  });

  // Like a fragment
  app.post("/api/fragments/:id/like", async (req, res) => {
    try {
      const fragment = await storage.getFragment(req.params.id);
      if (!fragment) {
        return res.status(404).json({ message: "Fragment not found" });
      }
      
      const updated = await storage.updateFragment(req.params.id, {
        likes: (fragment.likes || 0) + 1
      });
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to like fragment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
