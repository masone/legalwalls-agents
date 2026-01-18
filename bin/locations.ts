import dotenv from "dotenv";
dotenv.config();

import { discoverLocations } from "../lib/locations";

const url = "https://www.graffitifun.nl/locaties/";

async function main() {
  const locations = await discoverLocations(url);
  console.log(JSON.stringify(locations, null, 2));
}

main().catch(console.error);
