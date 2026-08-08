(() => {
  const FORMAT = "uyghur-tili-local-progress";
  const VERSION = 1;

  function createExportPayload(data, metadata = {}) {
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      edition: metadata.edition || "local",
      brandName: metadata.brandName || "Uyghur Tili",
      data: JSON.parse(JSON.stringify(data || {}))
    };
  }

  function parseImportPayload(text) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error("文件不是有效的 JSON");
    }

    if (!payload || payload.format !== FORMAT) {
      throw new Error("这不是 Uyghur Tili 学习记录");
    }
    if (payload.version !== VERSION) {
      throw new Error("学习记录版本暂不支持");
    }
    if (!payload.data || typeof payload.data !== "object" || Array.isArray(payload.data)) {
      throw new Error("学习数据缺失");
    }

    return JSON.parse(JSON.stringify(payload.data));
  }

  window.ANA_TILIM_PROGRESS_TRANSFER = Object.freeze({
    FORMAT,
    VERSION,
    createExportPayload,
    parseImportPayload
  });
})();
