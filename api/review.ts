import { VercelRequest, VercelResponse } from "@vercel/node";
import { moderateComment } from "../lib/moderation";
import { loadWall } from "../lib/api";

interface Comment {
  id: number;
  body: string;
  feedback: "confirmation" | "report";
  report_type: "illegal" | null;
  created_at: string;
}

const validateToken = (header: string | undefined) => {
  const token = process.env.API_KEY;
  if (!token || !header) {
    return false;
  }

  return header === `Bearer ${token}`;
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (process.env.NODE_ENV != "development" && !validateToken(request.headers.authorization)) {
    return response.status(401).json({ error: "Unauthorized" });
  }

  const { wallId, commentId } = request.query;
  if (!wallId || !commentId) {
    return response
      .status(400)
      .json({ error: "wallId & commentId is required" });
  }

  const wall = await loadWall(Number(wallId));
  if (!wall) {
    return response.status(404).json({ error: "Wall not found" });
  }

  const comment: Comment = wall.comments.find(
    (c: any) => c.id === Number(commentId),
  );
  if (!comment) {
    return response.status(404).json({ error: "Comment not found" });
  }

  try {
    const moderationResult = await moderateComment(comment.id, comment.body);
    return response.status(200).json(moderationResult);
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
