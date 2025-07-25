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
      },
      {
        title: "Morning Meditation by the Mon",
        content: "I discovered this trail during my most stressful finals week at WVU. Something about the way the morning mist rises from the Monongahela River here makes everything else fade away. The paved path winds perfectly along the water, with benches placed exactly where you need to pause and breathe.\n\nEdith Barill must have known what she was creating when this park was planned. Every morning at sunrise, you'll find students, professors, and townspeople walking this trail—each finding their own kind of peace. The river doesn't judge your struggles; it just keeps flowing, reminding you that everything passes in time. This place taught me that sometimes the best classroom is outdoors.",
        category: "story",
        latitude: 39.6300,  
        longitude: -79.9560,
        locationName: "Edith Barill Riverfront Park and Trail",
        author: "Jordan M.",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["riverfront", "meditation", "students", "peace", "trail"],
        likes: 19
      },
      {
        title: "Eternal Flame of Memory",
        content: "The Kennedy Memorial Park holds more than just the president's legacy—it holds the collective memory of a community that believed in hope during America's darkest hours. The memorial flame flickers day and night, a beacon that has witnessed decades of visitors seeking solace and inspiration.\n\nI come here every November 22nd, like my grandfather did, and his father before him. Three generations drawn to this quiet corner of Morgantown where time seems suspended. The trees have grown taller since 1963, but the flame burns just as bright. Children play on the nearby equipment while their parents pause at the memorial, teaching them about service, sacrifice, and the power of dreams that outlive the dreamer.",
        category: "memory",
        latitude: 39.6267,
        longitude: -79.9481,
        locationName: "John F. Kennedy Memorial Park",
        author: "Patricia W.",
        imageUrl: "https://images.unsplash.com/photo-1573160813859-3c96259d6e96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["memorial", "legacy", "generations", "hope", "community"],
        likes: 31
      },
      {
        title: "The Sheriff's Last Stand",
        content: "The Metropolitan Theatre holds more than just entertainment memories—it witnessed one of Morgantown's most dramatic moments in 1924, its opening year. When the notorious Hatfield gang tried to rob the box office during a sold-out show, Sheriff Thomas McKinley made his final stand right on these marble steps.\n\nLegend says you can still hear phantom gunshots echoing through the lobby on quiet Tuesday nights. The theatre's ushers refuse to work alone after 10 PM, claiming they've seen a figure in a long coat and badge patrolling the balcony. Some say it's Sheriff McKinley, still protecting theatergoers from beyond. Whether you believe in ghosts or not, the Metropolitan's grand architecture and blood-red velvet seats carry the weight of nearly a century of drama—both on stage and off.",
        category: "lore",
        latitude: 39.6298,
        longitude: -79.9547,
        locationName: "Metropolitan Theatre",
        author: "Harold T.",
        imageUrl: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["theatre", "sheriff", "gunfight", "haunted", "1924"],
        likes: 28
      },
      {
        title: "Barney's Big Break",
        content: "Right here on High Street, a young Don Knotts used to practice his comedy routines on the courthouse steps, entertaining anyone willing to listen. Local shop owners would give him quarters just to see his nervous, twitchy character that would later become Barney Fife on The Andy Griffith Show.\n\nThe bronze statue captures him mid-performance, and if you look closely at the courthouse steps where he used to practice, you can see worn spots in the stone from decades of aspiring performers following in his footsteps. Every year on his birthday, local comedians gather here for 'Knotts Night,' sharing jokes and stories. It's become a tradition that proves talent can bloom anywhere—even on small-town courthouse steps.",
        category: "history",
        latitude: 39.6297,
        longitude: -79.9549,
        locationName: "Don Knotts Statue & High Street",
        author: "Betty L.",
        imageUrl: "https://images.unsplash.com/photo-1594736797933-d0d7e0b7b0c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["don-knotts", "comedy", "hometown", "courthouse", "statue"],
        likes: 45
      },
      {
        title: "Echoes of Pearl Harbor",
        content: "The USS West Virginia mast stands as more than a memorial—it's a time portal. When the wind hits it just right, you can almost hear the battle cries from December 7th, 1941. Students walking past often stop, suddenly feeling the weight of history pressing down on them.\n\nMy grandfather served on destroyers in the Pacific and would visit this memorial every Veterans Day until he passed. He told me that touching the steel still warm from the Hawaiian sun was like shaking hands with the past. During thunderstorms, when lightning illuminates the mast against WVU's towers, you remember that some battles are never really over—they just become part of the landscape, waiting to teach new generations about sacrifice and honor.",
        category: "memory",
        latitude: 39.6344,
        longitude: -79.9553,
        locationName: "USS West Virginia Memorial - WVU Campus",
        author: "James R.",
        imageUrl: "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["pearl-harbor", "memorial", "veterans", "wvu", "sacrifice"],
        likes: 52
      },
      {
        title: "Iron Dreams and Furnace Ghosts",
        content: "The Henry Clay Iron Furnace still glows on winter nights—not from fire, but from the spirits of the ironworkers who died in the blast of 1889. Local historians say it was the result of cutting safety corners to meet production demands, but the workers' families knew the truth: the mountain itself was angry about being hollowed out.\n\nUrban explorers report hearing hammers striking anvils and the wheeze of old bellows when the fog rolls in. The furnace walls are blackened not just from iron production, but from the intensity of lives lived at the edge of survival. This industrial cathedral reminds us that Morgantown was built on the backs of men who turned mountains into steel, leaving their ghosts to guard the ruins of American industry.",
        category: "lore",
        latitude: 39.6201,
        longitude: -79.9234,
        locationName: "Henry Clay Iron Furnace",
        author: "Marcus D.",
        imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["iron-furnace", "industrial", "ghosts", "workers", "history"],
        likes: 33
      },
      {
        title: "The Wharf District Renaissance",
        content: "Twenty years ago, this waterfront was abandoned warehouses and broken dreams. Then something magical happened—the community decided to reclaim the riverbank. I watched my neighborhood transform from industrial wasteland to the beating heart of modern Morgantown.\n\nThe Waterfront Place Hotel rises like a phoenix from the old shipping docks, and the Caperton Trail connects stories spanning generations. Every morning, I jog past where my great-uncle used to load coal barges, now transformed into outdoor dining and art installations. The Wharf District proves that cities, like rivers, keep flowing forward. What was once the domain of industry is now the playground of possibility—a testament to Morgantown's ability to reinvent itself while honoring its past.",
        category: "story",
        latitude: 39.6288,
        longitude: -79.9601,
        locationName: "Wharf District & Waterfront Place",
        author: "Rosa M.",
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc1787dfab8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["wharf-district", "revitalization", "caperton-trail", "waterfront", "transformation"],
        likes: 41
      },
      {
        title: "Giants on the Hardwood",
        content: "Jerry West and Hot Rod Hundley aren't just bronze statues—they're guardians of basketball dreams. Every kid in Morgantown has shot imaginary game-winners while these legends watched from their pedestals. The statues capture more than athletic greatness; they embody the belief that small-town kids can conquer the world.\n\nDuring March Madness, fans leave offerings at their bases: lucky pennies, old ticket stubs, handwritten prayers for WVU victories. Jerry's statue shows him in that perfect shooting form that earned him the NBA logo silhouette, while Hot Rod's captures his theatrical flair. These bronze titans remind us that greatness isn't about where you come from—it's about how high you're willing to reach from whatever ground you're standing on.",
        category: "memory",
        latitude: 39.6341,
        longitude: -79.9531,
        locationName: "Jerry West & Hot Rod Hundley Statues - WVU",
        author: "Coach Tommy K.",
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["jerry-west", "hot-rod-hundley", "basketball", "wvu", "legends"],
        likes: 67
      },
      {
        title: "Art in the Evansdale Hills",
        content: "The WVU Art Museum holds secrets in every gallery. There's a painting on the third floor—'Mountain Morning' by an unknown artist—that changes with the weather. On sunny days, the painted mist seems to lift from the canvas. During storms, the mountain appears more ominous, almost alive.\n\nCurators have theories, but no explanations. The painting was donated anonymously in 1987 with a note: 'For those who understand that art and land are one.' Graduate students often discover their thesis topics just by sitting quietly with this piece. It's as if the mountain itself is teaching them about the connection between place and creativity. In a state where the landscape shapes the soul, this museum proves that art doesn't just hang on walls—it breathes with the mountains themselves.",
        category: "mystery",
        latitude: 39.6398,
        longitude: -79.9678,
        locationName: "WVU Art Museum - Evansdale Campus",
        author: "Dr. Elena V.",
        imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        tags: ["art-museum", "mystery-painting", "evansdale", "wvu", "supernatural"],
        likes: 29
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
