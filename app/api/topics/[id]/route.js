import { requireBearerAuth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { getSetting } from "@/lib/settings";

export async function GET(request, { params }) {
  const user = await requireBearerAuth(request, "user");
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const topic = await queryOne(
    `SELECT t.*, c.id AS course_id, c.title AS course_title, c.price AS course_price
     FROM topics t JOIN courses c ON c.id = t.course_id WHERE t.id = ? AND t.content_status = 'ready'`,
    [id]
  );
  if (!topic) return Response.json({ error: "Topic not found" }, { status: 404 });

  const price = Number(topic.course_price);
  const deviceId = request.headers.get("x-device-id") || null;

  if (price > 0) {
    const purchase = await queryOne(
      "SELECT id, device_id FROM course_purchases WHERE user_id = ? AND course_id = ?",
      [user.id, topic.course_id]
    );
    if (!purchase) {
      return Response.json(
        { error: "Please purchase this course to access its content.", code: "NOT_PURCHASED" },
        { status: 402 }
      );
    }

    const deviceLockEnabled = (await getSetting("device_lock_enabled")) === "true";
    if (deviceLockEnabled) {
      if (!purchase.device_id && deviceId) {
        await query("UPDATE course_purchases SET device_id = ? WHERE id = ?", [deviceId, purchase.id]);
      } else if (purchase.device_id && deviceId && purchase.device_id !== deviceId) {
        return Response.json(
          {
            error: "This course is locked to the device it was purchased on. Ask an admin to turn off device lock, or open it on your original device.",
            code: "DEVICE_LOCKED",
          },
          { status: 423 }
        );
      }
    }
  }

  const content = await queryOne(
    "SELECT content_json, content_json_hi FROM topic_contents WHERE topic_id = ?",
    [id]
  );
  const mcqs = await query("SELECT * FROM mcqs WHERE topic_id = ? ORDER BY id ASC", [id]);

  function safeParse(json) {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  return Response.json({
    topic: { id: topic.id, title: topic.title, course_id: topic.course_id, course_title: topic.course_title },
    content: safeParse(content?.content_json),
    content_hi: safeParse(content?.content_json_hi),
    mcqs,
  });
}
