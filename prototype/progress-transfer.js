(() => {
  const FORMAT = "uyghur-tili-local-progress";
  const VERSION = 1;
  const EDITION_NAMES = Object.freeze({
    cn: "Uyghur Tili 国内版",
    global: "Ana Tilim 海外版"
  });

  function createExportPayload(data, metadata = {}) {
    if (!Object.prototype.hasOwnProperty.call(EDITION_NAMES, metadata.edition)) {
      throw new Error("导出版本标识无效");
    }
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      edition: metadata.edition,
      brandName: metadata.brandName || "Uyghur Tili",
      data: JSON.parse(JSON.stringify(data || {}))
    };
  }

  function parseImportPayload(text, { expectedEdition } = {}) {
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
    if (!Object.prototype.hasOwnProperty.call(EDITION_NAMES, payload.edition)) {
      throw new Error("学习记录版本标识无效");
    }
    if (expectedEdition && !Object.prototype.hasOwnProperty.call(EDITION_NAMES, expectedEdition)) {
      throw new Error("当前应用版本标识无效");
    }
    if (expectedEdition && payload.edition !== expectedEdition) {
      throw new Error(`备份属于 ${EDITION_NAMES[payload.edition]}，不能导入 ${EDITION_NAMES[expectedEdition]}`);
    }

    return JSON.parse(JSON.stringify(payload));
  }

  window.ANA_TILIM_PROGRESS_TRANSFER = Object.freeze({
    FORMAT,
    VERSION,
    createExportPayload,
    parseImportPayload
  });
})();
