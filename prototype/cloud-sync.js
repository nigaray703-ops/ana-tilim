(function initializeAnaTilimCloud(global) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const PROGRESS_SCOPES = ["letters", "combos", "vocab", "practice", "reading"];

  class UnsupportedCloudSchemaError extends Error {
    constructor(version) {
      super(`Unsupported cloud schema version: ${version}`);
      this.name = "UnsupportedCloudSchemaError";
      this.version = version;
    }
  }

  function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validTimestamp(value, fallback) {
    return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : fallback;
  }

  function normalizeProgress(value) {
    const source = isObject(value) ? value : {};
    return Object.fromEntries(
      PROGRESS_SCOPES.map((scope) => [scope, isObject(source[scope]) ? clone(source[scope]) : {}])
    );
  }

  function normalizeSnapshot(value) {
    if (!isObject(value)) {
      throw new TypeError("Cloud snapshot must be an object");
    }

    const version = Number(value.schemaVersion || SCHEMA_VERSION);
    if (version > SCHEMA_VERSION) {
      throw new UnsupportedCloudSchemaError(version);
    }

    const fallbackTimestamp = "1970-01-01T00:00:00.000Z";
    const modifiedAt = validTimestamp(value.modifiedAt, fallbackTimestamp);
    const dailyActivity = isObject(value.dailyActivity) ? value.dailyActivity : {};

    return {
      schemaVersion: SCHEMA_VERSION,
      modifiedAt,
      preferencesUpdatedAt: validTimestamp(value.preferencesUpdatedAt, modifiedAt),
      favoriteUpdatedAt: validTimestamp(value.favoriteUpdatedAt, modifiedAt),
      learningProgress: normalizeProgress(value.learningProgress),
      mistakes: Array.isArray(value.mistakes) ? clone(value.mistakes.filter(isObject)) : [],
      favorite: Boolean(value.favorite),
      dailyActivity: {
        date: typeof dailyActivity.date === "string" ? dailyActivity.date : "",
        completedIds: Array.isArray(dailyActivity.completedIds)
          ? [...new Set(dailyActivity.completedIds.filter((item) => typeof item === "string"))]
          : []
      },
      preferences: isObject(value.preferences) ? clone(value.preferences) : {}
    };
  }

  function stableUnion(left, right) {
    return [...new Set([...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])])];
  }

  function mergeProgressValue(localValue, remoteValue, key, remoteIsNewer) {
    if (key === "completed") {
      return Boolean(localValue) || Boolean(remoteValue);
    }
    if (key.endsWith("Ids")) {
      return stableUnion(localValue, remoteValue);
    }
    if (isObject(localValue) || isObject(remoteValue)) {
      return mergeProgressObject(
        isObject(localValue) ? localValue : {},
        isObject(remoteValue) ? remoteValue : {},
        remoteIsNewer
      );
    }
    if (localValue === undefined) return clone(remoteValue);
    if (remoteValue === undefined) return clone(localValue);
    return clone(remoteIsNewer ? remoteValue : localValue);
  }

  function mergeProgressObject(localValue, remoteValue, remoteIsNewer) {
    const keys = new Set([...Object.keys(localValue), ...Object.keys(remoteValue)]);
    return Object.fromEntries(
      [...keys].map((key) => [
        key,
        mergeProgressValue(localValue[key], remoteValue[key], key, remoteIsNewer)
      ])
    );
  }

  function mistakeKey(item) {
    return [item.kind || "", item.targetId || "", item.pickedId || ""].join("|");
  }

  function mergeMistakes(localItems, remoteItems) {
    const indexed = [...localItems, ...remoteItems].map((item, index) => ({ item, index }));
    indexed.sort((left, right) => {
      const leftTime = Date.parse(left.item.createdAt || "");
      const rightTime = Date.parse(right.item.createdAt || "");
      if (Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) {
        return Number.isFinite(rightTime) ? 1 : -1;
      }
      return left.index - right.index;
    });

    const byKey = new Map();
    for (const entry of indexed) {
      const key = mistakeKey(entry.item);
      if (!byKey.has(key)) {
        byKey.set(key, clone(entry.item));
      }
    }
    return [...byKey.values()].slice(0, 24);
  }

  function mergeDailyActivity(localValue, remoteValue) {
    if (localValue.date === remoteValue.date) {
      return {
        date: localValue.date,
        completedIds: stableUnion(localValue.completedIds, remoteValue.completedIds)
      };
    }
    return clone(remoteValue.date > localValue.date ? remoteValue : localValue);
  }

  function mergeSnapshots(localValue, remoteValue) {
    const local = normalizeSnapshot(localValue);
    const remote = normalizeSnapshot(remoteValue);
    const remoteIsNewer = Date.parse(remote.modifiedAt) > Date.parse(local.modifiedAt);
    const learningProgress = {};

    for (const scope of PROGRESS_SCOPES) {
      learningProgress[scope] = mergeProgressObject(
        local.learningProgress[scope],
        remote.learningProgress[scope],
        remoteIsNewer
      );
    }

    const preferencesUseRemote =
      Date.parse(remote.preferencesUpdatedAt) > Date.parse(local.preferencesUpdatedAt);
    const favoriteUsesRemote =
      Date.parse(remote.favoriteUpdatedAt) > Date.parse(local.favoriteUpdatedAt);

    return {
      schemaVersion: SCHEMA_VERSION,
      modifiedAt: remoteIsNewer ? remote.modifiedAt : local.modifiedAt,
      preferencesUpdatedAt: preferencesUseRemote
        ? remote.preferencesUpdatedAt
        : local.preferencesUpdatedAt,
      favoriteUpdatedAt: favoriteUsesRemote ? remote.favoriteUpdatedAt : local.favoriteUpdatedAt,
      learningProgress,
      mistakes: mergeMistakes(local.mistakes, remote.mistakes),
      favorite: favoriteUsesRemote ? remote.favorite : local.favorite,
      dailyActivity: mergeDailyActivity(local.dailyActivity, remote.dailyActivity),
      preferences: clone(preferencesUseRemote ? remote.preferences : local.preferences)
    };
  }

  function createCloudSync(options = {}) {
    const supabaseClient = options.supabaseClient || null;
    const onStatus = typeof options.onStatus === "function" ? options.onStatus : () => {};
    const getLocalSnapshot =
      typeof options.getLocalSnapshot === "function"
        ? options.getLocalSnapshot
        : () => normalizeSnapshot({});
    const applyMergedSnapshot =
      typeof options.applyMergedSnapshot === "function" ? options.applyMergedSnapshot : () => {};
    const saveMergedSnapshot =
      typeof options.saveMergedSnapshot === "function" ? options.saveMergedSnapshot : () => {};
    const now = typeof options.now === "function" ? options.now : () => new Date();
    const setTimeoutFn =
      typeof options.setTimeoutFn === "function"
        ? options.setTimeoutFn
        : typeof global.setTimeout === "function"
          ? global.setTimeout.bind(global)
          : () => 0;
    const clearTimeoutFn =
      typeof options.clearTimeoutFn === "function"
        ? options.clearTimeoutFn
        : typeof global.clearTimeout === "function"
          ? global.clearTimeout.bind(global)
          : () => {};
    const isOnline =
      typeof options.isOnline === "function"
        ? options.isOnline
        : () => global.navigator?.onLine !== false;
    let currentSession = null;
    let currentStatus = {
      phase: supabaseClient?.auth ? "ready" : "local",
      authEvent: ""
    };
    let skipNextSignedInReconcile = false;
    let pendingSnapshot = null;
    let syncTimer = null;

    function setStatus(next) {
      currentStatus = { ...currentStatus, authEvent: "", ...next };
      onStatus(clone(currentStatus));
    }

    function ensureAuth() {
      if (!supabaseClient?.auth) {
        throw new Error("云端登录尚未配置");
      }
      return supabaseClient.auth;
    }

    function profile() {
      const user = currentSession?.user || null;
      const metadata = isObject(user?.user_metadata) ? user.user_metadata : {};
      return {
        email: user?.email || "",
        displayName: metadata.full_name || metadata.name || "",
        avatarUrl:
          metadata.custom_avatar_url || metadata.avatar_url || metadata.picture || ""
      };
    }

    async function writeSnapshot(value) {
      const snapshot = normalizeSnapshot(value);
      const result = await supabaseClient.from("learning_backups").upsert({
        user_id: currentSession.user.id,
        schema_version: snapshot.schemaVersion,
        payload: snapshot,
        client_updated_at: snapshot.modifiedAt
      });
      if (result?.error) throw result.error;
    }

    async function syncNow() {
      if (!pendingSnapshot || !currentSession || !supabaseClient) return;
      if (!isOnline()) {
        setStatus({ phase: "waiting-network", error: "" });
        return;
      }

      const snapshot = pendingSnapshot;
      setStatus({ phase: "syncing", error: "" });
      try {
        await writeSnapshot(snapshot);
        if (pendingSnapshot === snapshot) {
          pendingSnapshot = null;
        }
        setStatus({ phase: "synced", syncedAt: now().toISOString(), error: "" });
      } catch {
        pendingSnapshot = snapshot;
        setStatus({ phase: "sync-error", error: "同步失败，将自动重试" });
      }
    }

    function scheduleSync(value) {
      pendingSnapshot = normalizeSnapshot(value);
      if (!currentSession || !supabaseClient) return;
      if (!isOnline()) {
        setStatus({ phase: "waiting-network", error: "" });
        return;
      }
      if (syncTimer !== null) {
        clearTimeoutFn(syncTimer);
      }
      syncTimer = setTimeoutFn(() => {
        syncTimer = null;
        return syncNow();
      }, 1500);
    }

    async function reconcile() {
      if (!currentSession || typeof supabaseClient?.from !== "function") return;
      if (!isOnline()) {
        pendingSnapshot = normalizeSnapshot(getLocalSnapshot());
        setStatus({ phase: "waiting-network", error: "" });
        return;
      }

      const result = await supabaseClient
        .from("learning_backups")
        .select("schema_version,payload,client_updated_at,updated_at")
        .eq("user_id", currentSession.user.id)
        .maybeSingle();

      if (result?.error) {
        setStatus({ phase: "sync-error", error: "同步失败，将自动重试" });
        return;
      }

      const localSnapshot = normalizeSnapshot(getLocalSnapshot());
      let merged = localSnapshot;
      try {
        if (result?.data?.payload) {
          merged = mergeSnapshots(localSnapshot, result.data.payload);
          applyMergedSnapshot(merged);
          saveMergedSnapshot();
        }
      } catch (error) {
        if (error instanceof UnsupportedCloudSchemaError) {
          setStatus({ phase: "update-required", error: "" });
          return;
        }
        setStatus({ phase: "sync-error", error: "同步失败，将自动重试" });
        return;
      }

      pendingSnapshot = merged;
      await syncNow();
    }

    async function start() {
      if (!supabaseClient?.auth) {
        setStatus({ phase: "local", error: "" });
        return;
      }

      const result = await supabaseClient.auth.getSession();
      if (result?.error) throw result.error;
      currentSession = result?.data?.session || null;
      setStatus({ phase: currentSession ? "signed-in" : "ready", error: "" });
      if (currentSession) {
        await reconcile();
      }

      supabaseClient.auth.onAuthStateChange((event, session) => {
        currentSession = session || null;
        const shouldSkipReconcile =
          Boolean(currentSession) &&
          event === "SIGNED_IN" &&
          skipNextSignedInReconcile;
        if (shouldSkipReconcile) {
          skipNextSignedInReconcile = false;
        }
        setStatus({
          phase: event === "SIGNED_OUT" || !currentSession ? "ready" : "signed-in",
          authEvent: event,
          error: ""
        });
        if (currentSession && event === "SIGNED_IN" && !shouldSkipReconcile) {
          void reconcile();
        }
      });
    }

    async function signInWithGoogle(redirectTo) {
      setStatus({ phase: "signing-in", error: "" });
      const result = await ensureAuth().signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (result?.error) {
        setStatus({ phase: "error", error: result.error.message || "Google 登录失败" });
        throw result.error;
      }
    }

    async function requestEmailOtp(email) {
      setStatus({ phase: "sending-code", error: "" });
      const result = await ensureAuth().signInWithOtp({
        email,
        options: { shouldCreateUser: true }
      });
      if (result?.error) {
        setStatus({ phase: "error", error: result.error.message || "验证码发送失败" });
        throw result.error;
      }
      setStatus({ phase: "code-sent", error: "" });
    }

    async function verifyEmailOtp(email, token) {
      setStatus({ phase: "verifying-code", error: "" });
      const result = await ensureAuth().verifyOtp({ email, token, type: "email" });
      if (result?.error) {
        setStatus({ phase: "error", error: result.error.message || "验证码验证失败" });
        throw result.error;
      }
      currentSession = result?.data?.session || currentSession;
      setStatus({
        phase: currentSession ? "signed-in" : "ready",
        authEvent: currentSession ? "SIGNED_IN" : "",
        error: ""
      });
      if (currentSession) {
        await reconcile();
      }
    }

    async function signUpWithPassword(email, password, displayName) {
      setStatus({ phase: "registering", error: "" });
      skipNextSignedInReconcile = true;
      const result = await ensureAuth().signUp({
        email,
        password,
        options: { data: { full_name: displayName } }
      });
      if (result?.error) {
        skipNextSignedInReconcile = false;
        setStatus({ phase: "error", error: result.error.message || "注册失败" });
        throw result.error;
      }
      if (!result?.data?.session) {
        skipNextSignedInReconcile = false;
        const error = new Error("注册需要邮箱确认，请检查登录设置");
        setStatus({ phase: "error", error: error.message });
        throw error;
      }
      currentSession = result.data.session;
      setStatus({ phase: "signed-in", authEvent: "SIGNED_UP", error: "" });
      return result.data;
    }

    async function signInWithPassword(email, password) {
      setStatus({ phase: "signing-in", error: "" });
      const result = await ensureAuth().signInWithPassword({ email, password });
      if (result?.error) {
        setStatus({ phase: "error", error: result.error.message || "登录失败" });
        throw result.error;
      }
      currentSession = result?.data?.session || null;
      setStatus({
        phase: currentSession ? "signed-in" : "ready",
        authEvent: currentSession ? "SIGNED_IN" : "",
        error: ""
      });
      if (currentSession) {
        await reconcile();
      }
      return currentSession;
    }

    async function updateDisplayName(displayName) {
      if (!currentSession?.user) {
        throw new Error("请先登录后再修改名称");
      }
      const result = await ensureAuth().updateUser({
        data: { full_name: displayName }
      });
      if (result?.error) {
        throw result.error;
      }
      if (result?.data?.user) {
        currentSession = { ...currentSession, user: result.data.user };
      }
      setStatus({ phase: "signed-in", authEvent: "PROFILE_UPDATED", error: "" });
      return displayName;
    }

    async function uploadAvatar(file) {
      if (!currentSession?.user?.id) {
        throw new Error("请先登录后再上传头像");
      }
      if (!supabaseClient?.storage?.from) {
        throw new Error("头像存储尚未配置");
      }

      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif"
      };
      const extension = extensions[file?.type];
      if (!extension) {
        throw new Error("请选择 JPG、PNG、WebP 或 GIF 图片");
      }

      const path = `${currentSession.user.id}/avatar.${extension}`;
      setStatus({ phase: "uploading-avatar", error: "" });
      const bucket = supabaseClient.storage.from("avatars");
      const uploadResult = await bucket.upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true
      });
      if (uploadResult?.error) {
        setStatus({ phase: "signed-in", error: "头像上传失败，请稍后重试" });
        throw uploadResult.error;
      }

      const publicResult = bucket.getPublicUrl(path);
      const publicUrl = publicResult?.data?.publicUrl || "";
      if (!publicUrl) {
        setStatus({ phase: "signed-in", error: "头像地址生成失败" });
        throw new Error("头像地址生成失败");
      }

      const avatarUrl = `${publicUrl}?v=${now().getTime()}`;
      const updateResult = await ensureAuth().updateUser({
        data: { custom_avatar_url: avatarUrl }
      });
      if (updateResult?.error) {
        setStatus({ phase: "signed-in", error: "头像保存失败，请稍后重试" });
        throw updateResult.error;
      }
      if (updateResult?.data?.user) {
        currentSession = { ...currentSession, user: updateResult.data.user };
      } else {
        currentSession.user.user_metadata = {
          ...(currentSession.user.user_metadata || {}),
          custom_avatar_url: avatarUrl
        };
      }
      setStatus({ phase: "signed-in", authEvent: "PROFILE_UPDATED", error: "" });
      return avatarUrl;
    }

    async function signOut() {
      if (!supabaseClient?.auth) return;
      const result = await supabaseClient.auth.signOut();
      if (result?.error) throw result.error;
      currentSession = null;
      if (syncTimer !== null) {
        clearTimeoutFn(syncTimer);
        syncTimer = null;
      }
      setStatus({ phase: "ready", error: "" });
    }

    async function handleOnline() {
      if (pendingSnapshot) {
        await syncNow();
      } else if (currentSession) {
        await reconcile();
      }
    }

    return Object.freeze({
      start,
      signInWithGoogle,
      requestEmailOtp,
      verifyEmailOtp,
      signUpWithPassword,
      signInWithPassword,
      updateDisplayName,
      uploadAvatar,
      signOut,
      scheduleSync,
      syncNow,
      handleOnline,
      profile,
      session: () => currentSession,
      status: () => clone(currentStatus)
    });
  }

  global.ANA_TILIM_CLOUD = Object.freeze({
    SCHEMA_VERSION,
    UnsupportedCloudSchemaError,
    normalizeSnapshot,
    mergeSnapshots,
    createCloudSync
  });
})(window);
