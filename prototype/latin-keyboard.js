(() => {
  const ROWS = Object.freeze(["qwertyuiop", "asdfghjkl", "zxcvbnm"]);
  const EXTENDED_KEYS = Object.freeze(["ë", "ö", "ü"]);

  function applyKey(value, event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return value;
    if (event.key === "Backspace") return Array.from(value).slice(0, -1).join("");
    if (event.key === " ") return `${value} `;
    return /^[a-z]$/i.test(event.key) ? `${value}${event.key.toLowerCase()}` : value;
  }

  function applyExtendedKey(value, key) {
    return EXTENDED_KEYS.includes(key) ? `${value}${key}` : value;
  }

  window.ANA_TILIM_LATIN_KEYBOARD = Object.freeze({
    ROWS,
    EXTENDED_KEYS,
    applyKey,
    applyExtendedKey
  });
})();
