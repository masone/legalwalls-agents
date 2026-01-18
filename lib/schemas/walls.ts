import { z } from "zod";

// Location schema - reusable for various contexts
const locationBaseSchema = z.object({
  country: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
});

const locationWithAddressSchema = locationBaseSchema.extend({
  address: z.string().optional(),
});

// Street view data
const streetViewSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  zoom: z.number(),
  heading: z.number(),
  pitch: z.number(),
  sphere: z.boolean(),
});

// Comment schema
const commentSchema = z.object({
  id: z.number(),
  body: z.string(),
  feedback: z.enum(["confirmation", "report"]),
  report_type: z.enum(["private"]).nullable(),
  created_at: z.string().datetime(),
});

// Store schema (for nearby_stores)
const storeSchema = z.object({
  id: z.number(),
  name: z.string(),
  location: locationBaseSchema,
});

// Nearby wall schema (simplified version of Wall)
const nearbyWallSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string(),
  location: locationBaseSchema,
  streetview: streetViewSchema.nullable(),
});

// Full Wall schema (detailed)
export const wallSchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string(),
  location: locationWithAddressSchema,
  locked: z.null(),
  streetview: streetViewSchema.nullable(),
  nearby_stores: z.array(storeSchema),
  nearby_walls: z.array(nearbyWallSchema),
  description: z.string(),
  comments: z.array(commentSchema),
  created_at: z.string().datetime(),
});

// Wall schema for Walls array (simplified)
export const wallSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  status: z.string(),
  location: locationBaseSchema,
});

// Walls array schema
export const wallsSchema = z.array(wallSummarySchema);

// Type exports
export type Location = z.infer<typeof locationBaseSchema>;
export type LocationWithAddress = z.infer<typeof locationWithAddressSchema>;
export type StreetView = z.infer<typeof streetViewSchema>;
export type Comment = z.infer<typeof commentSchema>;
export type Store = z.infer<typeof storeSchema>;
export type NearbyWall = z.infer<typeof nearbyWallSchema>;
export type Wall = z.infer<typeof wallSchema>;
export type WallSummary = z.infer<typeof wallSummarySchema>;
export type Walls = z.infer<typeof wallsSchema>;
