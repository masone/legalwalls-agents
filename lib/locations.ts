import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { parseResponse, openai } from "./openai";
import { locationSchema, Location } from "./schemas/location";

const responseSchema = z.object({
  locations: z.array(locationSchema),
});

export async function discoverLocations(url: string): Promise<Location[]> {
  const promptId = "pmpt_6958de4b9b348194a4abd71621cd0134001c5c0d85803abe";

  const response = await openai.responses.create({    
    prompt: {
      id: promptId,
      variables: {
        url,
      },
    },
    text: {
      format: zodTextFormat(responseSchema, "locations"),
    },
  });

  const responseText = response.output_text;
  if (!responseText) {
    throw new Error("No output_text returned from Responses API");
  }

  const result = parseResponse(responseText, responseSchema);
  return result.locations;
}
