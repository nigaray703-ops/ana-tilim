(function initializeAnaTilimFeedback(global) {
  "use strict";

  const CATEGORIES = Object.freeze(["content", "audio", "display", "account", "other"]);
  const STATUSES = Object.freeze(["new", "reviewed", "resolved"]);

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validateFeedback(value) {
    if (!isObject(value)) throw new TypeError("反馈内容必须是对象");
    if (Object.prototype.hasOwnProperty.call(value, "attachment") || Object.prototype.hasOwnProperty.call(value, "attachments")) {
      throw new TypeError("暂不支持附件");
    }

    const category = typeof value.category === "string" ? value.category.trim() : "";
    const message = typeof value.message === "string" ? value.message.trim() : "";
    const contact = typeof value.contact === "string" ? value.contact.trim() : "";

    if (!CATEGORIES.includes(category)) throw new TypeError("请选择有效的反馈类型");
    if (message.length < 10) throw new TypeError("反馈内容至少填写 10 个字");
    if (message.length > 2000) throw new TypeError("反馈内容不能超过 2000 个字");
    if (contact.length > 120) throw new TypeError("联系方式不能超过 120 个字");

    return { category, message, contact };
  }

  function createFeedbackClient(options = {}) {
    const supabaseClient = options.supabaseClient || null;
    const edition = options.edition === "cn" ? "cn" : "global";
    const appVersion = typeof options.appVersion === "string" ? options.appVersion.slice(0, 80) : "unknown";

    function ensureClient() {
      if (!supabaseClient?.from) throw new Error("反馈服务尚未连接");
      return supabaseClient;
    }

    async function submit(value) {
      const feedback = validateFeedback(value);
      const result = await ensureClient().from("user_feedback").insert({
        ...feedback,
        edition,
        app_version: appVersion
      });
      if (result?.error) throw result.error;
      return true;
    }

    async function isAdmin() {
      const client = ensureClient();
      if (typeof client.rpc !== "function") return false;
      const result = await client.rpc("is_feedback_admin");
      if (result?.error) throw result.error;
      return result?.data === true;
    }

    async function list() {
      const result = await ensureClient()
        .from("user_feedback")
        .select("id,category,message,contact,edition,status,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (result?.error) throw result.error;
      return clone(Array.isArray(result?.data) ? result.data : []);
    }

    async function updateStatus(id, status) {
      if (typeof id !== "string" || !id.trim()) throw new TypeError("反馈 ID 无效");
      if (!STATUSES.includes(status)) throw new TypeError("无效的反馈状态");
      const result = await ensureClient()
        .from("user_feedback")
        .update({ status })
        .eq("id", id);
      if (result?.error) throw result.error;
      return true;
    }

    return Object.freeze({ submit, isAdmin, list, updateStatus });
  }

  global.ANA_TILIM_FEEDBACK = Object.freeze({ CATEGORIES, STATUSES, validateFeedback, createFeedbackClient });
})(window);
