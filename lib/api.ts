import { wallSchema, wallsSchema, Wall, Walls } from "./schemas/walls";

const token = process.env.API_KEY;

const fetchPath = async (path: string, options: RequestInit = {}) => {
  const url = process.env.API_URL + path;
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const text = await response.text();
  return text.length > 0 ? JSON.parse(text) : { success: true };
};

const fetchPathWithToken = (path: string) => {
  if (!token) {
    throw new Error("API token not defined");
  }

  return fetchPath(path, {
    headers: { Authorization: "Bearer " + token },
  });
};

export const loadWalls = async (): Promise<Walls> => {
  const data = await fetchPath("/walls");
  return wallsSchema.parse(data);
};

export const loadWall = async (wallId: number): Promise<Wall> => {
  const data = await fetchPathWithToken(`/walls/${wallId}`);
  return wallSchema.parse(data);
};
