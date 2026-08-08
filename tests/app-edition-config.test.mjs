import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const configPath = "prototype/app-config.js";
assert.ok(fs.existsSync(configPath), "global edition config should exist");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(configPath, "utf8"), context, { filename: configPath });

assert.deepEqual(JSON.parse(JSON.stringify(context.window.ANA_TILIM_APP_CONFIG)), {
  edition: "global",
  brandName: "Ana Tilim",
  brandNameUyghur: "ئانا تىلىم",
  logoPath: "./assets/logo.png",
  cloudEnabled: true,
  hiddenReadingUnitIds: [],
  progressStorageKey: "ana-tilim-progress",
  backupStorageKey: "ana-tilim-guest-progress-backup"
});

const appSource = fs.readFileSync("prototype/app.js", "utf8");
assert.ok(appSource.includes("window.ANA_TILIM_APP_CONFIG"), "app should read edition config");
assert.ok(appSource.includes("appConfig.cloudEnabled"), "cloud startup and auth UI should obey edition config");
assert.ok(appSource.includes("appConfig.brandName"), "visible brand should obey edition config");
assert.ok(appSource.includes("appConfig.progressStorageKey"), "local progress should use an edition-specific storage key");

console.log("app edition config checks passed");
