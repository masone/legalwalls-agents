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

export const loadWalls = () => {
  return fetchPath("/walls");
};

export const loadWall = (wallId: number) => {
  return fetchPathWithToken(`/walls/${wallId}`);
};
