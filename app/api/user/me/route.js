import { requireBearerAuth } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { deletionRequestJson, getPendingDeletionRequest } from "@/lib/accountDeletion";

export async function GET(request) {
  const auth = await requireBearerAuth(request, "user");
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await queryOne("SELECT id, phone, email, name, created_at FROM users WHERE id = ?", [auth.id]);
  if (!user) return Response.json({ error: "Account not found" }, { status: 404 });

  const topicsCompleted = await queryOne(
    "SELECT COUNT(*) AS n FROM topic_progress WHERE user_id = ? AND status = 'completed'",
    [user.id]
  );
  const testsTaken = await queryOne("SELECT COUNT(*) AS n FROM test_attempts WHERE user_id = ?", [user.id]);
  const avgScore = await queryOne(
    `SELECT COALESCE(AVG(correct_count / NULLIF(total_questions, 0)) * 100, 0) AS avg
     FROM test_attempts WHERE user_id = ?`,
    [user.id]
  );

  return Response.json({
    user: {
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name || (user.phone ? `+91 ${user.phone}` : (user.email || "Learner").split("@")[0]),
    },
    deletion_request: deletionRequestJson(await getPendingDeletionRequest(user.id)),
    stats: {
      topics_completed: topicsCompleted.n,
      tests_taken: testsTaken.n,
      avg_score: Math.round(Number(avgScore.avg)),
    },
  });
}
