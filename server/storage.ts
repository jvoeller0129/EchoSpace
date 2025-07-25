import { type User, type InsertUser, type Fragment, type InsertFragment } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getFragments(): Promise<Fragment[]>;
  getFragment(id: string): Promise<Fragment | undefined>;
  createFragment(fragment: InsertFragment): Promise<Fragment>;
  updateFragment(id: string, updates: Partial<Fragment>): Promise<Fragment | undefined>;
  deleteFragment(id: string): Promise<boolean>;
  getFragmentsByLocation(latitude: number, longitude: number, radiusKm: number): Promise<Fragment[]>;
  searchFragments(query: string, category?: string): Promise<Fragment[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private fragments: Map<string, Fragment>;

  constructor() {
    this.users = new Map();
    this.fragments = new Map();
    
    // Add some sample fragments for testing
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const sampleFragments: Omit<Fragment, 'id'>[] = [
      {
        title: "The Mountaineer's Ghost",
        content: "Every game day, students swear they see him before dawn—the original Mountaineer, still patrolling the sidelines of the old stadium. He appears as a shadowy figure in buckskin, rifle in hand, watching over his team one last time.\n\nThe legend started in 1963 when the first Mountaineer mascot, Boyd Chambers, passed away. Since then, dozens of students have reported seeing his spirit during big games, always appearing when the team needs him most. Some say if you're quiet enough at sunrise on the old field, you can still hear his victory yell echoing across the mountains.",
        category: "lore",
        latitude: 39.6395,
        longitude: -79.9553,
        locationName: "WVU Mountaineer Field",
        author: "Jake W.",
        imageUrl: "https://images.unsplash.com/photo-1508915830264-dc4bbfce2ad2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["mountaineer", "spirit", "football", "tradition"],
        likes: 34
      },
      {
        title: "Coal Mine Memory",
        content: "My grandfather worked these mines for thirty-seven years. Every morning he'd kiss my grandmother goodbye at this very spot, never knowing if he'd make it home. The mine closed in '92, but I still come here sometimes to remember his calloused hands and the way he'd hum old hymns while washing the coal dust from his face.\n\nThis place holds the memories of a thousand families, the weight of dreams deferred and hopes carried deep underground. The mountain remembers every man who gave his back to feed his family.",
        category: "memory",
        latitude: 39.6284,
        longitude: -79.9723,
        locationName: "Star City Mine Entrance",
        author: "Mary Beth K.",
        imageUrl: "https://images.unsplash.com/photo-1574263867128-fbec874c4443?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["coal-mining", "family", "heritage", "sacrifice"],
        likes: 18
      },
      {
        title: "The Monongahela River Crossing",
        content: "Before the bridges, before the ferries, the Cherokee had a sacred crossing here. My great-grandmother told stories of how the river spirits would test travelers—some would find the water shallow and welcoming, others would face rushing rapids that seemed to appear from nowhere.\n\nEven now, kayakers and fishermen report strange currents that don't match the weather, as if the old spirits still guard this bend in the river. On misty mornings, you can almost see the ancient footpaths leading down to the water's edge.",
        category: "history",
        latitude: 39.6497,
        longitude: -79.9647,
        locationName: "Monongahela River Bridge",
        author: "Robert S.",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["native-american", "river", "sacred", "crossing"],
        likes: 27
      },
      {
        title: "The Forest Cathedral",
        content: "Deep in Coopers Rock, there's a grove where the hemlocks grow in a perfect circle. Local hikers call it the Cathedral—the way the light filters through the canopy creates natural stained glass windows, and the acoustics are so perfect that whispers carry like prayers.\n\nI discovered this place during my darkest semester at WVU. Something about the ancient trees and the way they've stood sentinel for centuries put my problems into perspective. It's become my sanctuary, a place where the forest listens and somehow, things make sense again.",
        category: "story",
        latitude: 39.6531,
        longitude: -79.7964,
        locationName: "Coopers Rock State Forest",
        author: "Amanda L.",
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["forest", "cathedral", "healing", "nature"],
        likes: 15
      },
      {
        title: "High Street Midnight Mystery",
        content: "Every night at exactly 11:47 PM, a woman in a blue dress walks from the old Morgantown Hotel to the courthouse steps. She never varies her route, never acknowledges anyone who tries to speak to her. Local bartenders and late-night workers have been seeing her for decades.\n\nThe mystery deepened when someone found a 1953 newspaper article about a woman named Helen Morrison who disappeared on her wedding night from that very hotel. She was last seen wearing a blue dress, walking toward the courthouse to elope. Some say she's still looking for her groom. Others think she's trying to warn people about something that happened that night.",
        category: "mystery",
        latitude: 39.6295,
        longitude: -79.9559,
        locationName: "High Street Historic District",
        author: "Detective Mike R.",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["ghost", "mystery", "downtown", "wedding"],
        likes: 42
      }
    ];

    for (const fragment of sampleFragments) {
      const id = randomUUID();
      this.fragments.set(id, { ...fragment, id });
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getFragments(): Promise<Fragment[]> {
    return Array.from(this.fragments.values());
  }

  async getFragment(id: string): Promise<Fragment | undefined> {
    return this.fragments.get(id);
  }

  async createFragment(insertFragment: InsertFragment): Promise<Fragment> {
    const id = randomUUID();
    const fragment: Fragment = { 
      ...insertFragment, 
      id,
      likes: 0,
      imageUrl: insertFragment.imageUrl || null,
      tags: insertFragment.tags || []
    };
    this.fragments.set(id, fragment);
    return fragment;
  }

  async updateFragment(id: string, updates: Partial<Fragment>): Promise<Fragment | undefined> {
    const existing = this.fragments.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.fragments.set(id, updated);
    return updated;
  }

  async deleteFragment(id: string): Promise<boolean> {
    return this.fragments.delete(id);
  }

  async getFragmentsByLocation(latitude: number, longitude: number, radiusKm: number): Promise<Fragment[]> {
    const fragments = Array.from(this.fragments.values());
    
    return fragments.filter(fragment => {
      const distance = this.calculateDistance(
        latitude, longitude, 
        fragment.latitude, fragment.longitude
      );
      return distance <= radiusKm;
    });
  }

  async searchFragments(query: string, category?: string): Promise<Fragment[]> {
    const fragments = Array.from(this.fragments.values());
    const lowerQuery = query.toLowerCase();
    
    return fragments.filter(fragment => {
      const matchesQuery = !query || 
        fragment.title.toLowerCase().includes(lowerQuery) ||
        fragment.content.toLowerCase().includes(lowerQuery) ||
        (fragment.tags && fragment.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
        fragment.locationName.toLowerCase().includes(lowerQuery);
      
      const matchesCategory = !category || fragment.category === category;
      
      return matchesQuery && matchesCategory;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI/180);
  }
}

export const storage = new MemStorage();
