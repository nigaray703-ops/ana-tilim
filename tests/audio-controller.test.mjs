import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const instances = [];
class FakeAudio {
  constructor(src) {
    this.src = src;
    this.playbackRate = 1;
    this.loop = false;
    this.paused = false;
    instances.push(this);
  }
  play() {
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

const context = { window: {}, globalThis: null };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync("prototype/audio-controller.js", "utf8"), context);

const controller = context.window.ANA_TILIM_AUDIO.createAudioController({ AudioCtor: FakeAudio });
assert.equal(controller.setRate(0.75), 0.75);
assert.equal(controller.play({ src: "./one.webm", label: "one", contentKey: "letter:one" }), true);
assert.equal(instances[0].playbackRate, 0.75);
assert.equal(controller.setLoop(true), true);
assert.equal(instances[0].loop, true);
controller.play({ src: "./one-again.webm", label: "one again", contentKey: "letter:one" });
assert.equal(instances[1].loop, true, "replaying the same content must preserve looping");
assert.equal(controller.setRate(0.5), 1, "unsupported rates must normalize to 1");
assert.equal(instances[1].playbackRate, 1);
controller.play({ src: "./two.webm", label: "two", contentKey: "letter:two" });
assert.equal(instances[1].paused, true);
assert.equal(instances[2].loop, false, "changing content must reset looping");
controller.stop();
assert.deepEqual(JSON.parse(JSON.stringify(controller.snapshot())), {
  rate: 1,
  loop: false,
  contentKey: "",
  playing: false
});

const deferredInstances = [];
class DeferredAudio {
  constructor(src) {
    this.src = src;
    this.playbackRate = 1;
    this.loop = false;
    this.paused = false;
    this.playPromise = new Promise((resolve, reject) => {
      this.resolvePlay = resolve;
      this.rejectPlay = reject;
    });
    deferredInstances.push(this);
  }
  play() {
    return this.playPromise;
  }
  pause() {
    this.paused = true;
  }
}

function settlePromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

const events = [];
const callbackController = context.window.ANA_TILIM_AUDIO.createAudioController({
  AudioCtor: DeferredAudio,
  onStarted({ label }) {
    events.push(`started:${label}`);
  },
  onError({ label }) {
    events.push(`error:${label}`);
  }
});

callbackController.play({ src: "./first.webm", label: "first", contentKey: "letter:first" });
callbackController.play({ src: "./second.webm", label: "second", contentKey: "letter:second" });
deferredInstances[0].resolvePlay();
await settlePromises();
assert.deepEqual(events, [], "a replaced audio must not report a late start");
assert.equal(
  JSON.parse(JSON.stringify(callbackController.snapshot())).playing,
  true,
  "a late completion from replaced audio must not stop the active playback"
);
deferredInstances[1].resolvePlay();
await settlePromises();
assert.deepEqual(events, ["started:second"], "the active audio should report its start");
callbackController.play({ src: "./third.webm", label: "third", contentKey: "letter:third" });
deferredInstances[2].rejectPlay(new Error("blocked"));
await settlePromises();
assert.deepEqual(events, ["started:second", "error:third"], "the active audio should report its failure");
assert.equal(JSON.parse(JSON.stringify(callbackController.snapshot())).playing, false);

const stoppedEvents = [];
const stoppedController = context.window.ANA_TILIM_AUDIO.createAudioController({
  AudioCtor: DeferredAudio,
  onStarted({ label }) {
    stoppedEvents.push(`started:${label}`);
  },
  onError({ label }) {
    stoppedEvents.push(`error:${label}`);
  }
});
stoppedController.play({ src: "./stopped.webm", label: "stopped", contentKey: "letter:stopped" });
stoppedController.stop();
deferredInstances[3].rejectPlay(new Error("stopped"));
await settlePromises();
assert.deepEqual(stoppedEvents, [], "a stopped audio must not report a late failure");
assert.equal(JSON.parse(JSON.stringify(stoppedController.snapshot())).playing, false);
console.log("audio controller checks passed");
