(() => {
  const targets = [
    { value: "سا", label: "sa", filename: "rerecord_voice_combo_sa.webm" },
    { value: "شا", label: "sha", filename: "rerecord_voice_combo_sha.webm" },
    { value: "قا", label: "qa", filename: "rerecord_voice_combo_qa.webm" },
    { value: "كا", label: "ka", filename: "rerecord_voice_combo_ka.webm" },
    { value: "سە", label: "se", filename: "rerecord_voice_combo_se_e.webm" },
    { value: "شە", label: "she", filename: "rerecord_voice_combo_she_e.webm" },
    { value: "قە", label: "qe", filename: "rerecord_voice_combo_qe_e.webm" },
    { value: "كە", label: "ke", filename: "rerecord_voice_combo_ke_e.webm" },
    { value: "نېمە", label: "nëme · 什么", filename: "rerecord_voice_vocab_nime.webm" },
    { value: "سىڭىل", label: "singil · 妹妹", filename: "rerecord_voice_vocab_singil_family.webm" },
    { value: "دېڭىز", label: "dëngiz · 海", filename: "rerecord_voice_form_example_1bieeo2.webm" },
    { value: "ئۈستەل", label: "üstel · 桌子", filename: "rerecord_voice_vocab_stol_home.webm" },
    { value: "سۇس كۆك", label: "sus kök · 浅蓝色", filename: "rerecord_voice_vocab_sus_kok_color.webm" },
    { value: "ئىچىش", label: "ichish · 喝", filename: "rerecord_voice_vocab_ichish_action.webm" }
  ];
  const targetValue = document.getElementById("target-value");
  const targetLabel = document.getElementById("target-label");
  const queueProgress = document.getElementById("queue-progress");
  const completedCount = document.getElementById("completed-count");
  const targetList = document.getElementById("target-list");
  const startButton = document.getElementById("start-recording");
  const stopButton = document.getElementById("stop-recording");
  const status = document.getElementById("recording-status");
  const preview = document.getElementById("recording-preview");
  const download = document.getElementById("download-recording");
  const nextIncomplete = document.getElementById("next-incomplete");
  const completed = new Set();
  const queueButtons = [];
  let activeIndex = 0;
  let stream = null;
  let recorder = null;
  let previewUrl = null;
  let previewTargetIndex = null;
  let recordingState = "idle";

  function setStatus(message) {
    status.textContent = message;
  }

  function setIdle() {
    recordingState = "idle";
    startButton.disabled = false;
    stopButton.disabled = true;
  }

  function stopMicrophoneTracks() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
  }

  function clearCompletedTake() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
    preview.src = "";
    preview.hidden = true;
    download.href = "";
    download.download = "";
    previewTargetIndex = null;
    download.hidden = true;
    download.setAttribute("aria-disabled", "true");
  }

  function updateQueue() {
    const target = targets[activeIndex];
    targetValue.textContent = target.value;
    targetLabel.textContent = target.label;
    queueProgress.textContent = `${activeIndex + 1} / ${targets.length}`;
    completedCount.textContent = `已完成 ${completed.size} / ${targets.length}`;
    nextIncomplete.hidden = completed.size === 0 || completed.size === targets.length;
    queueButtons.forEach((button, index) => {
      button.setAttribute("aria-current", String(index === activeIndex));
      button.classList.toggle("is-complete", completed.has(index));
    });
  }

  function selectTarget(index) {
    if (recordingState !== "idle") {
      setStatus(recordingState === "finalizing" ? "正在生成试听，请等待当前录音收尾后再切换补录项。" : "请先停止当前录音，再切换补录项。");
      return;
    }
    clearCompletedTake();
    activeIndex = index;
    updateQueue();
    setStatus("准备就绪，请开始录制当前项。");
  }

  function supportedWebmType() {
    return ["audio/webm;codecs=opus", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
  }

  function reportRecordingError(message) {
    stopMicrophoneTracks();
    recorder = null;
    setIdle();
    setStatus(message);
  }

  async function startRecording() {
    clearCompletedTake();
    const recordedIndex = activeIndex;
    const recordedTarget = targets[recordedIndex];
    recordingState = "starting";
    startButton.disabled = true;
    stopButton.disabled = true;
    setStatus("正在请求麦克风权限…");

    try {
      if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) throw new Error("unsupported");
      const mimeType = supportedWebmType();
      if (!mimeType) throw new Error("unsupported");

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      let finished = false;
      recorder = new MediaRecorder(stream, { mimeType });
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size > 0) chunks.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        if (finished) return;
        finished = true;
        stopMicrophoneTracks();
        recorder = null;
        const blob = new Blob(chunks, { type: mimeType });
        if (!blob.size) {
          setIdle();
          setStatus("没有收到录音内容，请重新录制。");
          return;
        }
        previewUrl = URL.createObjectURL(blob);
        preview.src = previewUrl;
        preview.hidden = false;
        download.href = previewUrl;
        download.download = recordedTarget.filename;
        previewTargetIndex = recordedIndex;
        download.hidden = false;
        download.setAttribute("aria-disabled", "false");
        setIdle();
        setStatus("录音完成。请试听，确认后下载文件。");
      });
      recorder.addEventListener("error", () => {
        if (finished) return;
        finished = true;
        reportRecordingError("录音出现错误，请重新录制。");
      });
      recorder.start();
      recordingState = "recording";
      stopButton.disabled = false;
      setStatus("正在录音…说完后点击“停止并生成试听”。");
    } catch (error) {
      reportRecordingError(
        error?.message === "unsupported"
          ? "当前浏览器不支持 WebM 录音，请使用支持 MediaRecorder 的浏览器。"
          : "无法使用麦克风：请允许浏览器使用麦克风后重试。"
      );
    }
  }

  function stopRecording() {
    if (recorder?.state === "recording") {
      recordingState = "finalizing";
      stopButton.disabled = true;
      setStatus("正在生成试听…");
      recorder.stop();
    }
  }

  function goToNextIncomplete() {
    for (let offset = 1; offset <= targets.length; offset += 1) {
      const index = (activeIndex + offset) % targets.length;
      if (!completed.has(index)) {
        selectTarget(index);
        return;
      }
    }
  }

  targets.forEach((target, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "target-pill";
    button.textContent = target.value;
    button.dataset.index = String(index);
    button.addEventListener("click", () => selectTarget(index));
    queueButtons.push(button);
    targetList.append(button);
  });

  startButton.addEventListener("click", startRecording);
  stopButton.addEventListener("click", stopRecording);
  download.addEventListener("click", () => {
    if (!download.hidden && previewTargetIndex !== null) {
      completed.add(previewTargetIndex);
      updateQueue();
      setStatus("已标记为本次会话完成。可继续处理下一个未完成项。");
    }
  });
  nextIncomplete.addEventListener("click", goToNextIncomplete);
  clearCompletedTake();
  updateQueue();
})();
