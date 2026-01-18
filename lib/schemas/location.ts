import { z } from "zod";

export const locationSchema = z.object({
    summary: z.string().describe("Brief summary of your process finding the location and your confidence in its accuracy"),
    locations: z.array(
  z.object({
    title: z.string().describe("Name or title of the legal graffiti wall"),
  title: z.string().describe("Name or title of the legal graffiti wall"),
  description: z
    .string()
    .describe("Description of the location, rules, or any additional details found on the website")
    .nullable(),
  descriptionFallback: z
    .string()
    .describe("Description of the location, rules, or any additional details found elsewhere if not on the website"),
  lat: z.number().describe("Latitude coordinate of the location"),
  lng: z.number().describe("Longitude coordinate of the location"),
  url: z.string().describe("URL of the webpage describing the location"),  
}))});


export type Location = z.infer<typeof locationSchema>;
console.log(locationSchema.toJSONSchema());

{

  type: "object",
  properties: {
    title: {
      description: "Name or title of the legal graffiti wall",
      type: "string"
    },
    description: { anyOf: [Array] },
    descriptionFallback: {
      description: "Description of the location, rules, or any additional details found elsewhere if not on the website",
      type: "string"
    },
    lat: {
      description: "Latitude coordinate of the location",
      type: "number"
    },
    lng: {
      description: "Longitude coordinate of the location",
      type: "number"
    },
    url: {
      description: "URL of the webpage describing the location",
      type: "string"
    },
    summary: {
      description: "Brief summary of your process finding the location and your confidence in its accuracy",
      type: "string"
    }
  },
  required: [
    "title",
    "description",
    "descriptionFallback",
    "lat",
    "lng",
    "url",
    "summary"
  ],
  additionalProperties: false
}
