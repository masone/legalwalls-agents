const token = process.env.API_KEY;

const fetchPath = async (path: string, options: RequestInit = {}) => {
  const url = process.env.API_URL + path;
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    let body = text;
    try {
      body = JSON.stringify(JSON.parse(text), null, 2);
    } catch {}
    console.error(`API request to ${url} failed:`, {
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body,
    });
    throw new Error(`API request failed with status ${response.status}: ${text}`);
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
