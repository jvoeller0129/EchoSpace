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
        title: "The Forgotten Garden",
        content: "Hidden behind the main library building, through a narrow gap between two ivy-covered walls, lies a garden that time forgot. The stone benches are weathered smooth by decades of students seeking refuge from their studies.\n\nLocal legend says that anyone who finds this place during their most difficult moments will discover exactly the peace they need. The garden seems to change with each visitor—sometimes wild and overgrown, sometimes perfectly manicured, always exactly what the soul requires.",
        category: "story",
        latitude: 40.7128,
        longitude: -74.0060,
        locationName: "Central Library, Back Garden",
        author: "Sarah M.",
        imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["peaceful", "hidden", "students", "sanctuary"],
        likes: 12
      },
      {
        title: "City Lights Memory",
        content: "The first time I saw the skyline from this exact spot, I knew this city would become my home. It was during a late evening walk, when the lights were just beginning to twinkle against the dusky sky. Standing here now, years later, I can still feel that same sense of possibility and wonder.",
        category: "memory",
        latitude: 40.7130,
        longitude: -74.0065,
        locationName: "Riverside Park Overlook",
        author: "Marcus T.",
        imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["skyline", "evening", "first-time", "inspiration"],
        likes: 8
      },
      {
        title: "First Date Bench",
        content: "Where everything began on a rainy Tuesday afternoon. We had planned to meet at the coffee shop, but it was so crowded we ended up sitting on this bench under my umbrella, talking for hours. Now, five years later, we still come back here every anniversary to remember how it all started.",
        category: "memory",
        latitude: 40.7125,
        longitude: -74.0055,
        locationName: "Washington Square Park",
        author: "Elena R.",
        imageUrl: "https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["romance", "anniversary", "rain", "beginning"],
        likes: 23
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
