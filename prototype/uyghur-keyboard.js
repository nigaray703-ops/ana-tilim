(() => {
  const rows = [
    [
      ["KeyQ", "Q", "چ"],
      ["KeyW", "W", "ۋ"],
      ["KeyE", "E", "ې"],
      ["KeyR", "R", "ر"],
      ["KeyT", "T", "ت"],
      ["KeyY", "Y", "ي"],
      ["KeyU", "U", "ۇ"],
      ["KeyI", "I", "ڭ"],
      ["KeyO", "O", "و"],
      ["KeyP", "P", "پ"]
    ],
    [
      ["KeyA", "A", "ھ"],
      ["KeyS", "S", "س"],
      ["KeyD", "D", "د", "ژ"],
      ["KeyF", "F", "ا", "ف"],
      ["KeyG", "G", "ە", "گ"],
      ["KeyH", "H", "ى", "خ"],
      ["KeyJ", "J", "ق", "ج"],
      ["KeyK", "K", "ك", "ۆ"],
      ["KeyL", "L", "ل", "لا"]
    ],
    [
      ["KeyZ", "Z", "ز"],
      ["KeyX", "X", "ش"],
      ["KeyC", "C", "غ"],
      ["KeyV", "V", "ۈ"],
      ["KeyB", "B", "ب"],
      ["KeyN", "N", "ن"],
      ["KeyM", "M", "م"],
      ["Comma", ",", "،", ">"],
      ["Period", ".", ".", "<"],
      ["Slash", "/", "ئ", "؟"]
    ]
  ].map((row) =>
    row.map(([code, physical, value, shiftedValue = ""]) =>
      Object.freeze({ code, physical, value, shiftedValue })
    )
  );

  const spaceKey = Object.freeze({ code: "Space", physical: "Space", value: " ", shiftedValue: "" });
  const keys = [...rows.flat(), spaceKey];
  const keyByCode = new Map(keys.map((key) => [key.code, key]));
  const outputCandidates = keys
    .flatMap((key) => [
      { code: key.code, shifted: false, value: key.value },
      ...(key.shiftedValue ? [{ code: key.code, shifted: true, value: key.shiftedValue }] : [])
    ])
    .sort((left, right) => right.value.length - left.value.length || Number(left.shifted) - Number(right.shifted));

  function keyForCode(code, shifted = false) {
    const key = keyByCode.get(code);
    if (!key) return null;
    const value = shifted && key.shiftedValue ? key.shiftedValue : key.value;
    return { ...key, value, shifted: Boolean(shifted && key.shiftedValue) };
  }

  function keystrokesForText(text) {
    const source = String(text || "");
    const strokes = [];
    let index = 0;

    while (index < source.length) {
      const candidate = outputCandidates.find((item) => source.startsWith(item.value, index));
      if (!candidate) {
        index += Array.from(source.slice(index))[0]?.length || 1;
        continue;
      }
      strokes.push({ ...candidate });
      index += candidate.value.length;
    }

    return strokes;
  }

  window.ANA_TILIM_UYGHUR_KEYBOARD = Object.freeze({
    rows: Object.freeze(rows.map((row) => Object.freeze(row))),
    keyForCode,
    keystrokesForText
  });
})();
