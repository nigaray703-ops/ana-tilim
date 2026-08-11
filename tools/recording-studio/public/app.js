(() => {
  const categoryLabels = { alphabet: "字母", combos: "组合", vocab: "词汇", reading: "阅读", "form-examples": "写法例词" };
  const statusLabels = { "pending-review": "待审核已有音频", "needs-rerecord": "需要重新录制", pending: "需要新录制", recorded: "已录制待采用", "approved-current": "已批准当前音频", "approved-take": "已批准 take", imported: "已采用" };
  const STATUS_FILTERS = Object.freeze([["pending-review", "待审核已有音频"], ["pending", "需要新录制"], ["needs-rerecord", "需要重新录制"], ["recorded", "已录制待采用"], ["confirmed", "已确认"]]);
  const CONFIRMED_STATUSES = new Set(["approved-current", "approved-take", "imported"]);
  const model = { catalog: [], workspace: null, selectedStableId: null, query: "", category: "all", status: "all", activeRecorder: null, recordingTargetId: null, previewPlan: null, pendingUpload: null, imported: new Map(), playedProduction: new Map(), busy: false };
  const elements = Object.fromEntries(["target-search", "category-filter", "status-filter", "status-cards", "target-list", "target-detail", "preview-import", "import-plan", "apply-import", "studio-status", "studio-alert", "audit-summary"].map((id) => [id, document.getElementById(id)]));

  function text(value) { return value == null || value === "" ? "暂无英语释义" : String(value); }
  function setStatus(message, isError = false) { elements["studio-status"].textContent = message; elements["studio-status"].classList?.toggle("status-error", isError); elements["studio-alert"].hidden = !isError; elements["studio-alert"].textContent = isError ? message : ""; }
  function setButtonBusy(button, busy, label) { button.disabled = busy; if (label) button.textContent = label; }
  function focusSelected() { document.getElementById?.(`target-${encodeURIComponent(model.selectedStableId)}`)?.focus(); }
  function renderAndRestoreFocus() { render(); focusSelected(); }
  function targetState(stableId) { return model.workspace?.targets?.[stableId]; }
  function currentTarget() { return model.catalog.find((target) => target.stableId === model.selectedStableId) || null; }
  function normalized(target) { return [target.stableId, target.value, target.latin, target.meaning, target.english].filter(Boolean).join(" ").toLocaleLowerCase(); }
  function statusMatchesFilter(status, filterId) { if (filterId === "all") return true; if (filterId === "confirmed") return CONFIRMED_STATUSES.has(status); return status === filterId; }
  function filteredTargets() { const query = model.query.trim().toLocaleLowerCase(); return model.catalog.filter((target) => (model.category === "all" || target.category === model.category) && statusMatchesFilter(targetState(target.stableId)?.status, model.status) && (!query || normalized(target).includes(query))); }
  function apiError(payload) { return payload?.error?.message || "本机服务返回了无法识别的结果。"; }
  async function request(url, options = {}) { const response = await fetch(url, options); let payload; try { payload = await response.json(); } catch { throw new Error("本机服务返回的数据无法读取。"); } if (!response.ok) throw new Error(apiError(payload)); return payload; }
  function jsonRequest(url, body) { return request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); }

  async function refresh({ preserveSelection = true, focus = false } = {}) {
    const previous = preserveSelection ? model.selectedStableId : null;
    const [catalog, workspace] = await Promise.all([request("/api/catalog"), request("/api/state")]);
    model.catalog = catalog.targets || [];
    model.workspace = workspace;
    const visible = filteredTargets();
    model.selectedStableId = previous && model.catalog.some((target) => target.stableId === previous) ? previous : (visible.find((target) => ["pending-review", "needs-rerecord", "pending"].includes(targetState(target.stableId)?.status)) || visible[0] || model.catalog[0] || {}).stableId || null;
    render();
    if (focus) document.getElementById?.(`target-${encodeURIComponent(model.selectedStableId)}`)?.focus();
  }

  function populateFilters() {
    const categories = [...new Set(model.catalog.map((target) => target.category))];
    elements["category-filter"].replaceChildren(...["all", ...categories].map((value) => option(value, value === "all" ? "全部分类" : categoryLabels[value] || value)));
    elements["status-filter"].replaceChildren(option("all", "全部状态"), ...STATUS_FILTERS.map(([value, label]) => option(value, label)));
    elements["category-filter"].value = model.category;
    elements["status-filter"].value = model.status;
  }
  function option(value, label) { const item = document.createElement("option"); item.value = value; item.textContent = label; return item; }
  function button(label, handler, className = "") { const item = document.createElement("button"); item.type = "button"; item.className = className; item.textContent = label; item.disabled = model.busy || (label === "开始录音" && Boolean(model.activeRecorder || model.recordingTargetId || model.pendingUpload)) || (label === "停止并保存 take" && model.activeRecorder?.state !== "recording"); item.addEventListener("click", handler); return item; }
  function row(target, index) { const state = targetState(target.stableId); const item = button("", () => selectTarget(target.stableId)); item.id = `target-${encodeURIComponent(target.stableId)}`; item.className = "target-row"; item.setAttribute("aria-current", String(target.stableId === model.selectedStableId)); const ordinal = document.createElement("span"); ordinal.className = "target-index"; ordinal.textContent = String(index + 1); const value = document.createElement("span"); value.className = "target-text"; value.textContent = target.value; const status = document.createElement("span"); status.className = "target-status"; status.textContent = statusLabels[state?.status] || "待审听"; item.append(ordinal, value, status); return item; }
  function statusCount(counts, filterId) { return filterId === "confirmed" ? [...CONFIRMED_STATUSES].reduce((total, status) => total + (counts[status] || 0), 0) : counts[filterId] || 0; }
  function applyStatusFilter(filterId) { model.status = model.status === filterId ? "all" : filterId; const visible = filteredTargets(); if (!visible.some((target) => target.stableId === model.selectedStableId)) model.selectedStableId = visible[0]?.stableId || null; render(); }
  function renderSummary() { const counts = Object.values(model.workspace?.targets || {}).reduce((all, target) => ({ ...all, [target.status]: (all[target.status] || 0) + 1 }), {}); const summary = STATUS_FILTERS.map(([id, label]) => `${label} ${statusCount(counts, id)}`).join("｜"); const byCategory = Object.keys(categoryLabels).map((category) => `${categoryLabels[category]} ${model.catalog.filter((target) => target.category === category).length}`).join(" · "); elements["audit-summary"].textContent = `${model.catalog.length} 项｜${summary}｜${byCategory}`; const cards = STATUS_FILTERS.map(([id, label]) => { const card = button(`${label} ${statusCount(counts, id)}`, () => applyStatusFilter(id)); card.className = "status-card"; card.dataset.statusFilter = id; card.setAttribute("aria-pressed", String(model.status === id)); return card; }); elements["status-cards"].replaceChildren(...cards); }
  function renderList() { const visible = filteredTargets(); elements["target-list"].replaceChildren(...(visible.length ? visible.map(row) : [empty("没有符合当前搜索与筛选条件的录音目标。")])); }
  function empty(message) { const item = document.createElement("p"); item.className = "muted"; item.textContent = message; return item; }
  function render() { if (!model.workspace) return; populateFilters(); renderSummary(); renderList(); renderDetail(); renderImport(); }
  function selectTarget(stableId) { if (model.activeRecorder || model.recordingTargetId || model.pendingUpload || model.busy) { setStatus(model.pendingUpload ? "请先重试上传当前未上传录音；本地试听仍会保留。" : "正在处理当前录音，请完成后再切换目标。", true); return; } model.selectedStableId = stableId; render(); document.getElementById?.(`target-${encodeURIComponent(stableId)}`)?.focus(); }

  function audioForCurrent(target) { const audio = document.createElement("audio"); audio.controls = true; audio.src = `/api/audio/current/${encodeURIComponent(target.stableId)}`; audio.setAttribute("aria-label", `播放当前音频：${target.value}（${target.stableId}）`); audio.addEventListener("playing", () => { const imported = model.imported.get(target.stableId); if (imported) { model.playedProduction.set(target.stableId, { importId: imported.id, replacementSha256: imported.replacementSha256 }); renderDetail(); } }); audio.addEventListener("error", () => setStatus("当前课程音频无法播放，请检查该目标后重试。", true)); return audio; }
  function audioForPending(target, pending) { const audio = document.createElement("audio"); audio.controls = true; pending.previewUrl ||= URL.createObjectURL(pending.blob); audio.src = pending.previewUrl; audio.setAttribute("aria-label", `录音试听：${target.value}（${target.stableId}）`); return audio; }
  function audioForTake(target, take) { const audio = document.createElement("audio"); audio.controls = true; audio.src = `/api/audio/take/${encodeURIComponent(target.stableId)}/${encodeURIComponent(take.id)}`; audio.setAttribute("aria-label", `播放 take ${take.id}：${target.value}（${target.stableId}）`); audio.addEventListener("error", () => setStatus("这条 take 无法播放，未改变批准状态。", true)); return audio; }
  function appendField(parent, label, value) { const field = document.createElement("p"); field.textContent = `${label}：${text(value)}`; parent.append(field); }
  function renderDetail() {
    const target = currentTarget();
    if (!target) { elements["target-detail"].replaceChildren(empty("没有可显示的录音目标。")); return; }
    const state = targetState(target.stableId); const fragment = document.createElement("div");
    const header = document.createElement("div"); header.className = "detail-header"; const heading = document.createElement("div"); const value = document.createElement("h2"); value.className = "detail-target"; value.textContent = target.value; const stableId = document.createElement("p"); stableId.className = "stable-id"; stableId.textContent = target.stableId; heading.append(value, stableId); const status = document.createElement("span"); status.className = "target-status"; status.textContent = statusLabels[state?.status] || "待审听"; header.append(heading, status); fragment.append(header);
    const metadata = document.createElement("div"); metadata.className = "metadata"; appendField(metadata, "ULY", target.latin); appendField(metadata, "中文", target.meaning); appendField(metadata, "English", target.english); appendField(metadata, "分类", categoryLabels[target.category] || target.category); fragment.append(metadata);
    if (target.playable) { fragment.append(sectionTitle("当前课程音频")); const current = document.createElement("div"); current.className = "audio-card"; current.append(audioForCurrent(target)); const auditActions = document.createElement("div"); auditActions.className = "action-row"; auditActions.append(button("当前音频正确", () => auditCurrent(target.stableId)), button("需要重录", () => setAuditStatus(target.stableId, "needs-rerecord"), "danger")); current.append(auditActions); const imported = model.imported.get(target.stableId); const proof = model.playedProduction.get(target.stableId); if (imported?.hasBackup && proof?.importId === imported.id && proof.replacementSha256 === imported.replacementSha256) current.append(button("确认新版并删除这一条旧版备份", () => finalizeOne(target.stableId), "danger")); fragment.append(current); }
    else { fragment.append(sectionTitle("首次录制"), empty("这是新增内容，需要首次录制。")); }
    fragment.append(sectionTitle("新的录音 take")); const recordActions = document.createElement("div"); recordActions.className = "action-row"; recordActions.append(button("开始录音", () => startRecording(), "primary"), button("停止并保存 take", () => stopRecording())); if (model.pendingUpload?.stableId === target.stableId) { fragment.append(audioForPending(target, model.pendingUpload)); recordActions.append(button("重试上传这条录音", () => uploadPending(), "primary")); } fragment.append(recordActions); if (!state?.takes?.length) fragment.append(empty("还没有保存的新 take。重新录一条不会移除旧 take。")); else { const takes = document.createElement("div"); takes.className = "take-list"; [...state.takes].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).forEach((take, index) => { const card = document.createElement("div"); card.className = "take-card"; const label = document.createElement("h3"); label.textContent = `take ${state.takes.length - index} · ${take.createdAt}`; const meta = document.createElement("p"); meta.className = "muted"; meta.textContent = `${Math.round(take.durationMs)}ms · ${take.size} bytes`; card.append(label, meta, audioForTake(target, take), button("批准这条 take", () => approveTake(target.stableId, take.id))); takes.append(card); }); fragment.append(takes); }
    elements["target-detail"].replaceChildren(fragment);
  }
  function sectionTitle(label) { const heading = document.createElement("h3"); heading.className = "section-title"; heading.textContent = label; return heading; }
  async function auditCurrent(stableId) { await performTargetMutation(stableId, () => jsonRequest(`/api/targets/${encodeURIComponent(stableId)}/approve-current`, {}), "已标记当前课程音频正确。"); }
  async function setAuditStatus(stableId, status) { await performTargetMutation(stableId, () => jsonRequest(`/api/targets/${encodeURIComponent(stableId)}/status`, { status }), "已标记为需要重录。"); }
  async function approveTake(stableId, takeId) { await performTargetMutation(stableId, () => jsonRequest(`/api/targets/${encodeURIComponent(stableId)}/approve`, { takeId }), "已批准这条 take；尚未导入课程。" ); }
  async function performTargetMutation(stableId, action, success) { if (model.busy) return; model.busy = true; render(); try { await action(); await refresh(); setStatus(success); } catch (error) { setStatus(error.message || "操作失败，请重试。", true); } finally { model.busy = false; render(); focusSelected(); } }

  function supportedMimeType() { return ["audio/webm;codecs=opus", "audio/webm"].find((type) => globalThis.MediaRecorder?.isTypeSupported?.(type)); }
  function releaseTracks(stream) { stream?.getTracks?.().forEach((track) => track.stop()); }
  async function startRecording() {
    if (model.activeRecorder || model.recordingTargetId || model.pendingUpload || model.busy) return;
    const target = currentTarget(); if (!target) return;
    model.recordingTargetId = target.stableId; render(); setStatus("正在请求麦克风权限…");
    const mimeType = supportedMimeType();
    if (!mimeType || !navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) { model.recordingTargetId = null; renderAndRestoreFocus(); setStatus("当前浏览器不支持 WebM 录音，请使用 Chrome 后重试。", true); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recordedTargetId = model.recordingTargetId;
      const chunks = []; let terminal = false; const recorder = new MediaRecorder(stream, { mimeType }); recorder.stream = stream; model.activeRecorder = recorder;
      recorder.addEventListener("dataavailable", (event) => { if (event.data?.size > 0) chunks.push(event.data); });
      recorder.addEventListener("error", () => { terminal = true; releaseTracks(stream); model.activeRecorder = null; model.recordingTargetId = null; renderAndRestoreFocus(); setStatus("录音出现错误，请重新录制。", true); });
      recorder.addEventListener("stop", () => { if (!terminal) finishRecording({ chunks, mimeType, stream, stableId: recordedTargetId }); });
      recorder.start(); render(); setStatus("正在录音。停止后会保存为本机 take。" );
    } catch { releaseTracks(stream); model.activeRecorder = null; model.recordingTargetId = null; renderAndRestoreFocus(); setStatus("无法使用麦克风：请允许 Chrome 使用麦克风后重试。", true); }
  }
  function stopRecording() { if (model.activeRecorder?.state === "recording") { setStatus("正在完成录音…"); model.activeRecorder.stop(); } }
  async function finishRecording({ chunks, mimeType, stream, stableId }) { releaseTracks(stream); model.activeRecorder = null; model.recordingTargetId = null; const blob = new Blob(chunks, { type: mimeType }); if (!blob.size) { renderAndRestoreFocus(); setStatus("没有收到录音内容，请重新录制。", true); return; } model.pendingUpload = { stableId, blob }; render(); await uploadPending(); }
  async function uploadPending() { const pending = model.pendingUpload; if (!pending || model.busy) return; model.busy = true; render(); try { await request(`/api/takes/${encodeURIComponent(pending.stableId)}`, { method: "POST", headers: { "Content-Type": "audio/webm" }, body: pending.blob }); URL.revokeObjectURL?.(pending.previewUrl); model.pendingUpload = null; await refresh(); setStatus("录音已保存为新 take，仍需逐条批准。" ); } catch (error) { setStatus(`${error.message || "上传失败。"} 本地试听保留，可重试上传。`, true); } finally { model.busy = false; renderAndRestoreFocus(); } }
  function renderImport() { const plan = model.previewPlan; const nodes = !plan ? [empty("尚未生成导入预览。")] : plan.operations.length ? plan.operations.map((operation) => planRow(operation)) : [empty("没有已批准且需要导入的录音。")]; elements["import-plan"].replaceChildren(...nodes); elements["apply-import"].disabled = !plan || !plan.operations.length || model.busy; elements["apply-import"].textContent = plan ? `确认导入 ${plan.operations.length} 个批准录音` : "确认导入"; }
  function planRow(operation) { const item = document.createElement("div"); const target = model.catalog.find((candidate) => candidate.stableId === operation.stableId); const filename = operation.targetFilename || target?.currentFile || "未提供文件名"; const backup = operation.targetExisted ? `旧版安全备份位置 ${operation.backupDescriptor || "backups/<本次导入批次>"}` : "新目标不含旧版备份"; item.className = "plan-operation"; item.textContent = `${operation.stableId} · ${target?.value || "未知目标"} · ${filename} · 旧 SHA ${operation.currentSha256 || "无当前文件"} → 新 SHA ${operation.replacementSha256} · ${backup} · 录音文本哈希已核对，无变更（${operation.recordingTextHash || target?.recordingTextHash || "未提供"}）`; return item; }
  async function previewImport() { if (model.busy) return; model.busy = true; setButtonBusy(elements["preview-import"], true, "正在预览…"); try { model.previewPlan = await jsonRequest("/api/import/preview", {}); renderImport(); setStatus(`已生成 ${model.previewPlan.operations.length} 个批准录音的只读导入预览。`); } catch (error) { model.previewPlan = null; renderImport(); setStatus(error.message || "无法生成导入预览。", true); } finally { model.busy = false; setButtonBusy(elements["preview-import"], false, "预览导入"); renderImport(); } }
  async function applyImport() { const plan = model.previewPlan; if (!plan || model.busy) return; model.busy = true; elements["apply-import"].disabled = true; try { const result = await jsonRequest("/api/import/apply", { planId: plan.planId }); (result.operations || []).forEach((operation) => { model.playedProduction.delete(operation.stableId); model.imported.set(operation.stableId, { id: result.importId, replacementSha256: operation.replacementSha256, hasBackup: operation.targetExisted === true }); }); model.previewPlan = null; await refresh(); setStatus("导入完成。请播放当前课程音频后，再逐项确认删除旧版备份。" ); } catch (error) { model.previewPlan = null; setStatus(error.message || "导入失败，已清除预览，请重新预览。", true); } finally { model.busy = false; render(); focusSelected(); } }
  async function finalizeOne(stableId) { const imported = model.imported.get(stableId); const proof = model.playedProduction.get(stableId); if (!imported?.hasBackup || proof?.importId !== imported.id || proof.replacementSha256 !== imported.replacementSha256 || model.busy) return; model.busy = true; render(); try { await jsonRequest("/api/import/finalize", { importId: imported.id, stableId }); model.imported.delete(stableId); model.playedProduction.delete(stableId); setStatus("已确认新版并仅删除这一条已验证的旧版备份。" ); } catch (error) { setStatus(error.message || "无法确认这条旧版备份。", true); } finally { model.busy = false; renderAndRestoreFocus(); } }
  function onUnload() { releaseTracks(model.activeRecorder?.stream); if (model.activeRecorder?.state === "recording") model.activeRecorder.stop(); }
  elements["target-search"].addEventListener("input", (event) => { model.query = event.target.value; const visible = filteredTargets(); if (!visible.some((target) => target.stableId === model.selectedStableId)) model.selectedStableId = visible[0]?.stableId || null; render(); });
  elements["category-filter"].addEventListener("change", (event) => { model.category = event.target.value; const visible = filteredTargets(); if (!visible.some((target) => target.stableId === model.selectedStableId)) model.selectedStableId = visible[0]?.stableId || null; render(); });
  elements["status-filter"].addEventListener("change", (event) => { const next = event.target.value; model.status = next === model.status ? "all" : next; const visible = filteredTargets(); if (!visible.some((target) => target.stableId === model.selectedStableId)) model.selectedStableId = visible[0]?.stableId || null; render(); });
  elements["preview-import"].addEventListener("click", previewImport); elements["apply-import"].addEventListener("click", applyImport); globalThis.addEventListener?.("beforeunload", onUnload);
  const ready = refresh().then(() => setStatus("本机录音工作台已准备就绪。" )).catch((error) => setStatus(error.message || "无法读取本机录音目录。", true));
  globalThis.recordingStudio = { model, ready, refresh, startRecording, stopRecording, uploadPending };
})();
