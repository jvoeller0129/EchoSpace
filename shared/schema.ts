import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fragments = pgTable("fragments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  locationName: text("location_name").notNull(),
  author: text("author").notNull(),
  imageUrl: text("image_url"),
  tags: text("tags").array().default([]),
  likes: integer("likes").default(0),
});

export const insertFragmentSchema = createInsertSchema(fragments).omit({
  id: true,
  likes: true,
});

export const updateFragmentSchema = insertFragmentSchema.partial();

export type InsertFragment = z.infer<typeof insertFragmentSchema>;
export type Fragment = typeof fragments.$inferSelect;
export type UpdateFragment = z.infer<typeof updateFragmentSchema>;

// Extended fragment type with optional distance for frontend use
export type FragmentWithDistance = Fragment & { distance?: number };

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
