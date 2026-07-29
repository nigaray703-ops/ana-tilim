(function attachAudioController(window) {
  function normalizeRate(value) {
    return Number(value) === 0.75 ? 0.75 : 1;
  }

  function createAudioController(options = {}) {
    const AudioCtor = options.AudioCtor || window.Audio;
    let activeAudio = null;
    let rate = 1;
    let loop = false;
    let contentKey = "";
    let playing = false;

    function snapshot() {
      return { rate, loop, contentKey, playing };
    }

    function setRate(value) {
      rate = normalizeRate(value);
      if (activeAudio) activeAudio.playbackRate = rate;
      return rate;
    }

    function setLoop(enabled) {
      loop = Boolean(enabled);
      if (activeAudio) activeAudio.loop = loop;
      return loop;
    }

    function stop({ resetLoop = true } = {}) {
      if (activeAudio) activeAudio.pause();
      activeAudio = null;
      contentKey = "";
      playing = false;
      if (resetLoop) loop = false;
    }

    function play({ src, label, contentKey: nextContentKey, autoplay } = {}) {
      if (!src) return false;

      if (activeAudio) activeAudio.pause();
      if (nextContentKey !== contentKey) loop = false;

      const audio = new AudioCtor(src);
      const details = { src, label, contentKey: nextContentKey, autoplay };
      activeAudio = audio;
      contentKey = nextContentKey || "";
      playing = true;
      audio.playbackRate = rate;
      audio.loop = loop;

      try {
        Promise.resolve(audio.play()).then(
          () => {
            if (activeAudio !== audio) return;
            options.onStarted?.(details);
          },
          (error) => {
            if (activeAudio !== audio) return;
            playing = false;
            options.onError?.({ ...details, error });
          }
        );
      } catch (error) {
        if (activeAudio !== audio) return true;
        playing = false;
        options.onError?.({ ...details, error });
      }

      return true;
    }

    return { play, setRate, setLoop, stop, snapshot };
  }

  window.ANA_TILIM_AUDIO = { createAudioController };
})(window);
