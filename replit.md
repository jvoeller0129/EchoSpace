# Echo Space - Location-Based Storytelling Platform

## Overview

Echo Space is a location-based storytelling platform that allows users to discover and share location-specific stories, memories, and experiences. The application combines an interactive map interface with user-generated content to create a rich tapestry of place-based narratives.

**Current Features**: 15 narrative fragments across Morgantown, WV with map-based discovery
**AR Vision**: Real-time augmented reality fragment discovery and creation through mobile camera

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built using React 18 with TypeScript, utilizing modern React patterns including hooks and context. The application uses Vite as the build tool for fast development and optimized production builds. The UI is built with shadcn/ui components (Radix UI primitives) and styled with Tailwind CSS for a consistent, accessible design system.

**Key Frontend Decisions:**
- **React with TypeScript**: Chosen for type safety and better developer experience
- **Vite**: Selected over Create React App for faster build times and better development experience
- **shadcn/ui**: Provides accessible, customizable components without the overhead of a full component library
- **Wouter**: Lightweight routing solution chosen over React Router for smaller bundle size
- **TanStack Query**: Handles server state management and caching for better user experience

### Backend Architecture
The backend uses Express.js with TypeScript in ESM module format. It follows a simple REST API pattern with route handlers organized separately from the main server setup. The architecture supports both development and production environments with different static file serving strategies.

**Key Backend Decisions:**
- **Express.js**: Chosen for simplicity and ecosystem maturity
- **ESM Modules**: Modern JavaScript module system for better tree-shaking and future compatibility
- **Development/Production Split**: Different serving strategies optimize for development speed vs production performance

### Data Storage Solutions
The application uses a dual-storage approach:
- **In-Memory Storage**: Currently implemented for development with `MemStorage` class
- **PostgreSQL with Drizzle ORM**: Configured for production use with schema-first approach
- **Neon Database**: Serverless PostgreSQL provider for scalable cloud deployment

**Database Schema Design:**
- **Fragments Table**: Stores location-based content with spatial data (latitude/longitude)
- **Users Table**: Basic user authentication and management
- **Schema-First Approach**: Using Drizzle ORM with Zod validation for type-safe database operations

### Authentication and Authorization
Currently uses a basic session-based approach with potential for expansion:
- **Session Storage**: Uses `connect-pg-simple` for PostgreSQL session storage
- **Password-based Authentication**: Simple username/password system
- **Future-Ready**: Architecture allows for OAuth integration if needed

### External Service Integrations
- **Leaflet Maps**: Open-source mapping solution for interactive map display
- **OpenStreetMap**: Tile provider for map data
- **Unsplash**: Used for sample imagery in development

**Mapping Technology Choice:**
- **Leaflet over Google Maps**: Chosen for open-source nature, no API costs, and full customization control
- **Dynamic Import**: Leaflet is imported dynamically to avoid SSR issues

## Key Components

### Core Components
1. **MapContainer**: Interactive map with fragment markers and user location
2. **DiscoveryPanel**: Search, filter, and browse fragments
3. **FragmentDetailPanel**: Display detailed fragment information
4. **CreateFragmentModal**: Form for creating new location-based content
5. **MobileTabBar**: Bottom navigation for mobile devices

### Responsive Design Strategy
- **Desktop-First**: Full sidebar layout with map and panels
- **Mobile-Optimized**: Tab-based navigation with full-screen views
- **Progressive Enhancement**: Graceful degradation across device sizes

## Data Flow

### Fragment Discovery Flow
1. User opens application → Geolocation permission requested
2. Map loads with nearby fragments → API call to `/api/fragments` with location parameters
3. User can search/filter → Additional API calls with query parameters
4. Fragment selection → Detailed view with potential like/interaction capabilities

### Content Creation Flow
1. User triggers create modal → Current location captured
2. Form submission → Validation with Zod schemas
3. API call to create fragment → Immediate UI update
4. Map refresh → New fragment appears on map

### Search and Discovery
- **Location-Based**: Fragments retrieved by proximity to user location
- **Text Search**: Full-text search across fragment titles and content
- **Category Filtering**: Predefined categories (story, memory, lore, mystery, history)
- **Real-Time Updates**: Immediate UI updates after content creation

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe database ORM with schema validation
- **@tanstack/react-query**: Server state management and caching
- **leaflet**: Interactive maps functionality
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management with validation

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: esbuild bundles Node.js server to `dist/index.js`
- **Database**: Drizzle migrations handle schema changes

### Environment Configuration
- **Development**: Local development with hot reload and in-memory storage
- **Production**: Compiled server serving static files with PostgreSQL database
- **Database URL**: Environment variable configuration for different deployment targets

### Scalability Considerations
- **Serverless-Ready**: Neon Database and stateless server design
- **CDN-Friendly**: Static assets can be served from CDN
- **Horizontal Scaling**: Stateless architecture supports multiple server instances

The application is designed to scale from local development to production deployment while maintaining a simple, maintainable codebase focused on the core user experience of discovering and sharing location-based stories.

## Future AR Integration Plans

### AR Fragment Discovery
- **Camera View**: Real-time fragment overlay on camera feed when pointing phone at locations
- **Distance Indicators**: Visual range indicators showing fragment proximity and direction
- **3D Anchoring**: Fragments appear anchored to specific real-world locations
- **Progressive Discovery**: Fragments become visible as users get within trigger radius

### AR Fragment Creation
- **Point and Drop**: Tap screen to place new fragment at exact camera target location
- **Visual Placement**: Preview fragment position before confirming placement
- **Context Capture**: Auto-capture location photo and GPS coordinates
- **Immersive Authoring**: Write fragment content while seeing placement in AR

### Technical Approach Options
1. **8th Wall WebAR + Lightship VPS**: Production-ready with centimeter accuracy
2. **AR.js + A-Frame**: Free MVP approach with GPS-based positioning  
3. **WebXR Device API**: Future-proofed native browser AR support

### Implementation Priority
- Phase 1: AR.js prototype for GPS-based fragment discovery
- Phase 2: Enhanced creation interface with AR placement preview
- Phase 3: Lightship VPS integration for precise world anchoring