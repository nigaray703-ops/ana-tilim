const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FEEDBACK_OWNER_EMAIL = Deno.env.get("FEEDBACK_OWNER_EMAIL") || "";
const FEEDBACK_WEBHOOK_SECRET = Deno.env.get("FEEDBACK_WEBHOOK_SECRET") || "";
const FEEDBACK_FROM_EMAIL = Deno.env.get("FEEDBACK_FROM_EMAIL") || "Ana Tilim Feedback <onboarding@resend.dev>";

const CATEGORY_LABELS: Record<string, string> = {
  content: "课程内容",
  audio: "音频",
  display: "界面显示",
  account: "账号与数据",
  other: "其他"
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!RESEND_API_KEY || !FEEDBACK_OWNER_EMAIL || !FEEDBACK_WEBHOOK_SECRET) {
    return new Response("Feedback email secrets are not configured", { status: 503 });
  }
  if (request.headers.get("x-feedback-webhook-secret") !== FEEDBACK_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const record = (payload.record && typeof payload.record === "object" ? payload.record : payload) as Record<string, unknown>;
  const recordId = String(record.id || "unknown").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "unknown";
  const category = CATEGORY_LABELS[String(record.category || "")] || "其他";
  const message = escapeHtml(record.message);
  const contact = escapeHtml(record.contact || "未提供");
  const edition = record.edition === "cn" ? "国内版 Uyghur Tili" : "海外版 Ana Tilim";

  const emailResult = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `feedback-${recordId}`
    },
    body: JSON.stringify({
      from: FEEDBACK_FROM_EMAIL,
      to: [FEEDBACK_OWNER_EMAIL],
      subject: `Ana Tilim 新反馈：${category}`,
      html: `
        <h2>Ana Tilim 收到新反馈</h2>
        <p><strong>版本：</strong>${escapeHtml(edition)}</p>
        <p><strong>类型：</strong>${escapeHtml(category)}</p>
        <p><strong>联系方式：</strong>${contact}</p>
        <p><strong>内容：</strong></p>
        <div style="white-space:pre-wrap;padding:12px;border:1px solid #d8deea;border-radius:8px">${message}</div>
        <p style="color:#667085">完整记录只可由已登记的管理员 Gmail 账号在应用内查看。</p>
      `
    })
  });

  if (!emailResult.ok) {
    return new Response("Email delivery failed", { status: 502 });
  }
  return Response.json({ ok: true });
});
