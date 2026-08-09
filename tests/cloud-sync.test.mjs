import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const sourcePath = "prototype/cloud-sync.js";
const source = fs.readFileSync(sourcePath, "utf8");
const context = { window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: sourcePath });

const {
  createCloudSync,
  mergeSnapshots,
  normalizeSnapshot,
  UnsupportedCloudSchemaError
} =
  context.window.ANA_TILIM_CLOUD;

function snapshot(overrides = {}) {
  return {
    schemaVersion: 1,
    modifiedAt: "2026-07-28T00:00:00.000Z",
    preferencesUpdatedAt: "2026-07-28T00:00:00.000Z",
    favoriteUpdatedAt: "2026-07-28T00:00:00.000Z",
    learningProgress: {
      latinWriting: {},
      letters: {},
      combos: {},
      syllableTraining: {},
      vocab: {},
      practice: {},
      reading: {}
    },
    mistakes: [],
    syllableMistakes: { connection: [], break: [] },
    favorite: false,
    dailyActivity: { date: "2026-07-28", completedIds: [] },
    preferences: {},
    ...overrides
  };
}

assert.deepEqual(
  JSON.parse(JSON.stringify(normalizeSnapshot({}).syllableMistakes ?? null)),
  { connection: [], break: [] },
  "legacy cloud snapshots should normalize missing syllable mistake buckets to empty arrays"
);

{
  const merged = mergeSnapshots(
    snapshot({
      modifiedAt: "2026-07-28T02:00:00.000Z",
      syllableMistakes: { connection: ["connection-01"], break: ["break-01"] }
    }),
    snapshot({
      modifiedAt: "2026-07-28T03:00:00.000Z",
      syllableMistakes: { connection: [], break: ["break-01", "break-02"] }
    })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(merged.syllableMistakes)),
    { connection: [], break: ["break-01", "break-02"] },
    "newer independent syllable mistake buckets should preserve a connection clear without clearing break review"
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      learningProgress: {
        latinWriting: { qwerty: { completed: true } }
      }
    }),
    snapshot({
      modifiedAt: "2026-07-28T01:00:00.000Z",
      learningProgress: {
        latinWriting: {
          qwerty: { completedIds: ["keyboard-ana", "keyboard-kitab"] }
        }
      }
    })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(merged.learningProgress.latinWriting.qwerty)),
    { completed: true },
    "legacy QWERTY completion should dominate a partial lesson prefix without creating invalid merged progress"
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      modifiedAt: "2026-07-28T04:00:00.000Z",
      syllableMistakes: { connection: [], break: [] }
    }),
    snapshot({
      modifiedAt: "2026-07-28T03:00:00.000Z",
      syllableMistakes: { connection: ["connection-01"], break: ["break-01"] }
    })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(merged.syllableMistakes)),
    { connection: [], break: [] },
    "a newer local clear should override older remote syllable mistakes instead of reviving them"
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": { completedIds: ["warmup-ba", "warmup-pa", "warmup-ta"] }
        }
      }
    }),
    snapshot({
      modifiedAt: "2026-07-28T01:00:00.000Z",
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": { completedIds: ["warmup-ba", "warmup-pa"] }
        }
      }
    })
  );
  assert.deepEqual(
    [...merged.learningProgress.syllableTraining["two-letter-warmup"].completedIds],
    ["warmup-ba", "warmup-pa", "warmup-ta"],
    "cloud merge should retain unique source-backed warmup submissions"
  );
}

{
  const completedWarmup = {
    completedIds: [
      "warmup-ba", "warmup-pa", "warmup-ta", "warmup-na", "warmup-la",
      "warmup-ma", "warmup-be-e", "warmup-pe-e", "warmup-te-e", "warmup-ne-e"
    ],
    completed: true
  };
  const merged = mergeSnapshots(
    snapshot({
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completedWarmup,
          "vowel-nucleus": {
            completedIds: [
              "vowel-nucleus-01", "vowel-nucleus-02", "vowel-nucleus-03", "vowel-nucleus-04"
            ],
            completed: true
          }
        }
      }
    }),
    snapshot({
      modifiedAt: "2026-07-28T01:00:00.000Z",
      learningProgress: {
        syllableTraining: {
          "two-letter-warmup": completedWarmup,
          "vowel-nucleus": {
            completedIds: ["vowel-nucleus-01", "vowel-nucleus-02"],
            completed: false
          }
        }
      }
    })
  );
  assert.deepEqual(
    [...merged.learningProgress.syllableTraining["vowel-nucleus"].completedIds],
    ["vowel-nucleus-01", "vowel-nucleus-02", "vowel-nucleus-03", "vowel-nucleus-04"],
    "cloud merge should retain the older device's valid longer rule prefix instead of overwriting it"
  );
  assert.equal(
    merged.learningProgress.syllableTraining["vowel-nucleus"].completed,
    true,
    "cloud merge should preserve syllable rule completion"
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      learningProgress: {
        latinWriting: { qwerty: { completed: true } },
        letters: { first: { completed: true } },
        combos: {},
        vocab: {},
        practice: {},
        reading: {}
      }
    }),
    snapshot({
      modifiedAt: "2026-07-28T01:00:00.000Z",
      learningProgress: {
        latinWriting: {},
        letters: {},
        combos: { open: { completed: true } },
        vocab: {},
        practice: {},
        reading: {}
      }
    })
  );
  assert.equal(merged.learningProgress.letters.first.completed, true);
  assert.equal(merged.learningProgress.combos.open.completed, true);
  assert.equal(
    merged.learningProgress.latinWriting.qwerty.completed,
    true,
    "Latin QWERTY completion should survive cloud normalization and merge"
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      modifiedAt: "2026-07-28T02:00:00.000Z",
      learningProgress: {
        letters: { first: { completed: true, listenCompletedIds: ["be"] } },
        combos: {},
        vocab: {},
        practice: {},
        reading: {}
      }
    }),
    snapshot({
      modifiedAt: "2026-07-28T03:00:00.000Z",
      learningProgress: {
        letters: { first: { completed: false, listenCompletedIds: ["pe", "be"] } },
        combos: {},
        vocab: {},
        practice: {},
        reading: {}
      }
    })
  );
  assert.equal(merged.learningProgress.letters.first.completed, true);
  assert.deepEqual([...merged.learningProgress.letters.first.listenCompletedIds], ["be", "pe"]);
}

{
  const merged = mergeSnapshots(
    snapshot({
      mistakes: [
        {
          kind: "letter",
          targetId: "be",
          pickedId: "pe",
          attempts: 1,
          createdAt: "2026-07-28T00:00:00.000Z"
        }
      ]
    }),
    snapshot({
      mistakes: [
        {
          kind: "letter",
          targetId: "be",
          pickedId: "pe",
          attempts: 2,
          createdAt: "2026-07-28T01:00:00.000Z"
        },
        ...Array.from({ length: 30 }, (_, index) => ({
          kind: "vocab",
          targetId: `word-${index}`,
          pickedId: "",
          createdAt: `2026-07-27T${String(index % 24).padStart(2, "0")}:00:00.000Z`
        }))
      ]
    })
  );
  assert.equal(merged.mistakes.length, 24);
  assert.equal(
    merged.mistakes.filter((item) => item.kind === "letter" && item.targetId === "be").length,
    1
  );
  assert.equal(merged.mistakes[0].attempts, 2);
}

{
  const sameDay = mergeSnapshots(
    snapshot({ dailyActivity: { date: "2026-07-28", completedIds: ["letters:a"] } }),
    snapshot({ dailyActivity: { date: "2026-07-28", completedIds: ["vocab:b", "letters:a"] } })
  );
  assert.deepEqual([...sameDay.dailyActivity.completedIds], ["letters:a", "vocab:b"]);

  const newerDay = mergeSnapshots(
    snapshot({ dailyActivity: { date: "2026-07-27", completedIds: ["old"] } }),
    snapshot({ dailyActivity: { date: "2026-07-28", completedIds: ["new"] } })
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(newerDay.dailyActivity)),
    { date: "2026-07-28", completedIds: ["new"] }
  );
}

{
  const merged = mergeSnapshots(
    snapshot({
      preferencesUpdatedAt: "2026-07-28T03:00:00.000Z",
      favoriteUpdatedAt: "2026-07-28T01:00:00.000Z",
      preferences: { showLatin: false },
      favorite: false
    }),
    snapshot({
      preferencesUpdatedAt: "2026-07-28T02:00:00.000Z",
      favoriteUpdatedAt: "2026-07-28T04:00:00.000Z",
      preferences: { showLatin: true },
      favorite: true
    })
  );
  assert.deepEqual(JSON.parse(JSON.stringify(merged.preferences)), { showLatin: false });
  assert.equal(merged.favorite, true);
}

assert.throws(
  () => normalizeSnapshot(snapshot({ schemaVersion: 2 })),
  (error) => error instanceof UnsupportedCloudSchemaError,
  "future cloud schema should require an application update"
);

{
  const localController = createCloudSync({
    supabaseClient: null,
    getLocalSnapshot: () => snapshot()
  });
  await localController.start();
  assert.equal(localController.status().phase, "local");
  assert.equal(localController.session(), null);
}

{
  const calls = [];
  const auth = {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithOAuth(payload) {
      calls.push(["oauth", payload]);
      return { data: {}, error: null };
    },
    async signInWithOtp(payload) {
      calls.push(["otp", payload]);
      return { data: {}, error: null };
    },
    async verifyOtp(payload) {
      calls.push(["verify", payload]);
      return {
        data: { session: { user: { id: "user-1", email: "learner@example.com" } } },
        error: null
      };
    },
    async signOut() {
      calls.push(["signout"]);
      return { error: null };
    }
  };
  const controller = createCloudSync({
    supabaseClient: { auth },
    getLocalSnapshot: () => snapshot()
  });

  await controller.start();
  await controller.signInWithGoogle("http://127.0.0.1:4173/prototype/");
  await controller.requestEmailOtp("learner@example.com");
  await controller.verifyEmailOtp("learner@example.com", "123456");
  await controller.signOut();

  assert.deepEqual(
    JSON.parse(JSON.stringify(calls)),
    [
      [
        "oauth",
        {
          provider: "google",
          options: { redirectTo: "http://127.0.0.1:4173/prototype/" }
        }
      ],
      [
        "otp",
        {
          email: "learner@example.com",
          options: { shouldCreateUser: true }
        }
      ],
      [
        "verify",
        {
          email: "learner@example.com",
          token: "123456",
          type: "email"
        }
      ],
      ["signout"]
    ]
  );
  assert.equal(controller.session(), null, "signing out should clear only the cloud session");
}

{
  let authStateListener = null;
  const statuses = [];
  const session = { user: { id: "user-1", email: "learner@example.com" } };
  const auth = {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange(listener) {
      authStateListener = listener;
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithOAuth() {
      return { data: {}, error: null };
    },
    async signInWithOtp() {
      return { data: {}, error: null };
    },
    async verifyOtp() {
      return { data: { session }, error: null };
    },
    async signOut() {
      return { error: null };
    }
  };
  const controller = createCloudSync({
    supabaseClient: { auth },
    getLocalSnapshot: () => snapshot(),
    onStatus: (status) => statuses.push(status)
  });

  await controller.start();
  authStateListener("SIGNED_IN", session);

  assert.equal(
    statuses.at(-1).authEvent,
    "SIGNED_IN",
    "a successful authentication event should be exposed to the learner UI"
  );
}

{
  const calls = [];
  const session = {
    user: {
      id: "user-1",
      email: "learner@example.com",
      user_metadata: {}
    }
  };
  const auth = {
    async getSession() {
      return { data: { session }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async updateUser(payload) {
      calls.push(["update-user", payload]);
      session.user = {
        ...session.user,
        user_metadata: {
          ...session.user.user_metadata,
          ...payload.data
        }
      };
      return { data: { user: session.user }, error: null };
    }
  };
  const storage = {
    from(bucket) {
      assert.equal(bucket, "avatars");
      return {
        async upload(path, file, options) {
          calls.push(["upload", path, file, options]);
          return { data: { path }, error: null };
        },
        getPublicUrl(path) {
          calls.push(["public-url", path]);
          return {
            data: {
              publicUrl: `https://cdn.example.com/storage/v1/object/public/avatars/${path}`
            }
          };
        }
      };
    }
  };
  const client = {
    auth,
    storage,
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return { data: null, error: null };
        },
        async upsert() {
          return { data: null, error: null };
        }
      };
    }
  };
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot(),
    now: () => new Date("2026-07-29T00:00:00.000Z")
  });
  const file = { name: "my-photo.png", type: "image/png", size: 1024 };

  await controller.start();
  const avatarUrl = await controller.uploadAvatar(file);

  assert.equal(
    avatarUrl,
    "https://cdn.example.com/storage/v1/object/public/avatars/user-1/avatar.png?v=1785283200000"
  );
  assert.equal(controller.profile().avatarUrl, avatarUrl);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), [
    "upload",
    "user-1/avatar.png",
    file,
    {
      cacheControl: "3600",
      contentType: "image/png",
      upsert: true
    }
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.at(-1))), [
    "update-user",
    {
      data: {
        custom_avatar_url:
          "https://cdn.example.com/storage/v1/object/public/avatars/user-1/avatar.png?v=1785283200000"
      }
    }
  ]);
}

{
  const calls = [];
  let authStateListener = null;
  let cloudReads = 0;
  const registeredSession = {
    user: {
      id: "new-user",
      email: "learner@example.com",
      user_metadata: { full_name: "Nigar" }
    }
  };
  const auth = {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange(listener) {
      authStateListener = listener;
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signUp(payload) {
      calls.push(["sign-up", payload]);
      authStateListener("SIGNED_IN", registeredSession);
      return {
        data: { session: registeredSession, user: registeredSession.user },
        error: null
      };
    },
    async signInWithPassword(payload) {
      calls.push(["password-login", payload]);
      return { data: { session: registeredSession }, error: null };
    },
    async updateUser(payload) {
      calls.push(["update-user", payload]);
      registeredSession.user = {
        ...registeredSession.user,
        user_metadata: {
          ...registeredSession.user.user_metadata,
          ...payload.data
        }
      };
      return { data: { user: registeredSession.user }, error: null };
    }
  };
  const client = {
    auth,
    from(table) {
      assert.equal(table, "learning_backups");
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          cloudReads += 1;
          return { data: null, error: null };
        },
        async upsert() {
          return { data: null, error: null };
        }
      };
    }
  };
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot()
  });

  await controller.start();
  const signUpData = await controller.signUpWithPassword(
    "learner@example.com",
    "safe-pass-123",
    "Nigar"
  );
  assert.equal(signUpData.session.user.id, "new-user");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0])), [
    "sign-up",
    {
      email: "learner@example.com",
      password: "safe-pass-123",
      options: { data: { full_name: "Nigar" } }
    }
  ]);
  assert.equal(
    cloudReads,
    0,
    "new registration must not reconcile guest progress before fresh initialization"
  );

  await controller.updateDisplayName("Ana");
  assert.equal(controller.profile().displayName, "Ana");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1])), [
    "update-user",
    { data: { full_name: "Ana" } }
  ]);

  await controller.signInWithPassword("learner@example.com", "safe-pass-123");
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2])), [
    "password-login",
    {
      email: "learner@example.com",
      password: "safe-pass-123"
    }
  ]);
  assert.equal(cloudReads, 1, "existing password login should reconcile cloud learning");
}

{
  const auth = {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signUp() {
      return {
        data: {
          session: null,
          user: { id: "pending-user", email: "pending@example.com" }
        },
        error: null
      };
    }
  };
  const controller = createCloudSync({
    supabaseClient: { auth },
    getLocalSnapshot: () => snapshot()
  });
  await controller.start();
  await assert.rejects(
    controller.signUpWithPassword("pending@example.com", "safe-pass-123", "Pending"),
    /注册需要邮箱确认/,
    "registration without a session must not be presented as completed"
  );
}

function createSupabaseFake({ remoteRow = null, selectError = null } = {}) {
  const calls = { reads: 0, upserts: [] };
  const session = { user: { id: "user-1", email: "learner@example.com" } };
  const auth = {
    async getSession() {
      return { data: { session }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe() {} } } };
    },
    async signInWithOAuth() {
      return { data: {}, error: null };
    },
    async signInWithOtp() {
      return { data: {}, error: null };
    },
    async verifyOtp() {
      return { data: { session }, error: null };
    },
    async signOut() {
      return { error: null };
    }
  };
  const client = {
    auth,
    from(table) {
      assert.equal(table, "learning_backups");
      return {
        select() {
          return this;
        },
        eq(column, value) {
          assert.equal(column, "user_id");
          assert.equal(value, "user-1");
          return this;
        },
        async maybeSingle() {
          calls.reads += 1;
          return { data: remoteRow, error: selectError };
        },
        async upsert(row) {
          calls.upserts.push(JSON.parse(JSON.stringify(row)));
          return { data: null, error: null };
        }
      };
    }
  };
  return { client, calls };
}

{
  const { client, calls } = createSupabaseFake();
  const timers = [];
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot(),
    setTimeoutFn(callback) {
      timers.push(callback);
      return timers.length;
    },
    clearTimeoutFn() {},
    isOnline: () => true
  });
  await controller.start();
  const initialWrites = calls.upserts.length;
  controller.scheduleSync(snapshot({ modifiedAt: "2026-07-28T01:00:00.000Z" }));
  controller.scheduleSync(snapshot({ modifiedAt: "2026-07-28T02:00:00.000Z" }));
  controller.scheduleSync(snapshot({ modifiedAt: "2026-07-28T03:00:00.000Z" }));
  await timers.at(-1)();
  assert.equal(
    calls.upserts.length,
    initialWrites + 1,
    "debounced local changes should produce one additional cloud write"
  );
  assert.equal(
    calls.upserts.at(-1).payload.modifiedAt,
    "2026-07-28T03:00:00.000Z",
    "the newest pending snapshot should be uploaded"
  );
  assert.deepEqual(
    Object.keys(calls.upserts.at(-1).payload).sort(),
    [
      "dailyActivity",
      "favorite",
      "favoriteUpdatedAt",
      "learningProgress",
      "mistakes",
      "modifiedAt",
      "preferences",
      "preferencesUpdatedAt",
      "schemaVersion",
      "syllableMistakes"
    ],
    "cloud payload should contain only approved learning fields"
  );
}

{
  let online = false;
  const phases = [];
  const { client, calls } = createSupabaseFake();
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot(),
    onStatus: (status) => phases.push(status.phase),
    isOnline: () => online
  });
  await controller.start();
  controller.scheduleSync(snapshot({ modifiedAt: "2026-07-28T04:00:00.000Z" }));
  assert.equal(calls.upserts.length, 0);
  assert.equal(phases.at(-1), "waiting-network");
  online = true;
  await controller.handleOnline();
  assert.equal(calls.upserts.length, 1, "reconnecting should upload pending local learning");
}

{
  const remote = snapshot({
    modifiedAt: "2026-07-28T02:00:00.000Z",
    learningProgress: {
      letters: {},
      combos: { open: { completed: true } },
      vocab: {},
      practice: {},
      reading: {}
    }
  });
  const { client, calls } = createSupabaseFake({
    remoteRow: {
      schema_version: 1,
      payload: remote,
      client_updated_at: remote.modifiedAt,
      updated_at: remote.modifiedAt
    }
  });
  const order = [];
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () =>
      snapshot({
        modifiedAt: "2026-07-28T01:00:00.000Z",
        learningProgress: {
          letters: { first: { completed: true } },
          combos: {},
          vocab: {},
          practice: {},
          reading: {}
        }
      }),
    applyMergedSnapshot(value) {
      assert.equal(value.learningProgress.letters.first.completed, true);
      assert.equal(value.learningProgress.combos.open.completed, true);
      order.push("apply");
    },
    saveMergedSnapshot() {
      order.push("save");
    }
  });
  await controller.start();
  assert.deepEqual(order, ["apply", "save"], "merged learning should be saved locally first");
  assert.equal(calls.upserts.length, 1, "the merged snapshot should then be written to cloud");
}

{
  const remote = snapshot({
    learningProgress: {
      latinWriting: {},
      letters: {},
      combos: {},
      vocab: {},
      practice: {},
      reading: {},
      futureScope: { unsafe: { completed: true } }
    }
  });
  const { client, calls } = createSupabaseFake({
    remoteRow: {
      schema_version: 1,
      payload: remote,
      client_updated_at: remote.modifiedAt,
      updated_at: remote.modifiedAt
    }
  });
  const phases = [];
  let applied = false;
  let saved = false;
  let validated = 0;
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot(),
    validateSnapshot(value) {
      validated += 1;
      assert.ok(value.learningProgress.futureScope, "the validator should receive raw remote data before normalization");
      throw new Error("unknown cloud progress scope");
    },
    applyMergedSnapshot() {
      applied = true;
    },
    saveMergedSnapshot() {
      saved = true;
    },
    onStatus: (status) => phases.push(status.phase)
  });
  await controller.start();
  assert.equal(validated, 1, "remote cloud data should be validated once before merge");
  assert.equal(applied, false, "invalid remote cloud data should not be applied locally");
  assert.equal(saved, false, "invalid remote cloud data should not be saved locally");
  assert.equal(calls.upserts.length, 0, "invalid remote cloud data should not overwrite the remote row");
  assert.equal(phases.at(-1), "sync-error");
}

{
  const phases = [];
  const { client, calls } = createSupabaseFake({
    remoteRow: {
      schema_version: 2,
      payload: snapshot({ schemaVersion: 2 }),
      client_updated_at: "2026-07-28T00:00:00.000Z",
      updated_at: "2026-07-28T00:00:00.000Z"
    }
  });
  const controller = createCloudSync({
    supabaseClient: client,
    getLocalSnapshot: () => snapshot(),
    onStatus: (status) => phases.push(status.phase)
  });
  await controller.start();
  assert.equal(phases.at(-1), "update-required");
  assert.equal(calls.upserts.length, 0, "future cloud data must never be overwritten");
}

console.log("cloud snapshot, authentication, and sync controller checks passed");
