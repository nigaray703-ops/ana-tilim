(() => {
  window.ANA_TILIM_PRACTICE_EN = {
    groups: {
      "listening-loop": {
        title: "Sound recognition",
        goal: "Listen, then choose the correct letter from all 32 letters.",
        status: "Available"
      },
      "repeat-loop": {
        title: "Repeat aloud",
        goal: "Repeat all 32 letters in standard alphabet order.",
        status: "Available"
      },
      "writing-loop": {
        title: "Writing",
        goal: "Practice the shapes and dot positions of all 32 letters on the writing pad.",
        status: "Available"
      },
      "keyboard-loop": {
        title: "Keyboard",
        goal: "Type all 32 letters one at a time to learn their keyboard positions.",
        status: "Available"
      },
      "review-loop": {
        title: "Mistake review",
        goal: "Letters answered incorrectly in practice appear here automatically.",
        status: "Added automatically"
      }
    },
    templates: {
      listen: { type: "Letter", label: "Listening letter" },
      repeat: { type: "Letter", label: "Letter to repeat" },
      write: { type: "Letter", label: "Letter to write" },
      keyboard: { type: "Letter", label: "Keyboard letter" }
    },
    audioStatus: "Uses the human letter recording"
  };
})();
