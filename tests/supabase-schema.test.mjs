import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const configPath = "prototype/cloud-config.js";
const schemaPath = "prototype/supabase-schema.sql";

const configSource = fs.readFileSync(configPath, "utf8");
const schemaSource = fs.readFileSync(schemaPath, "utf8");
const context = { window: {} };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(configSource, context, { filename: configPath });

assert.deepEqual(
  Object.keys(context.window.ANA_TILIM_CLOUD_CONFIG).sort(),
  ["supabasePublishableKey", "supabaseUrl"],
  "public cloud config should expose only the project URL and publishable key"
);

for (const forbidden of ["service_role", "databasePassword", "googleClientSecret"]) {
  assert.ok(
    !configSource.toLowerCase().includes(forbidden.toLowerCase()),
    `public cloud config must not contain ${forbidden}`
  );
}

assert.match(
  schemaSource,
  /user_id\s+uuid\s+primary key\s+references\s+auth\.users\s*\(\s*id\s*\)/i,
  "learning backups should be owned by an authenticated Supabase user"
);
assert.match(
  schemaSource,
  /alter table\s+public\.learning_backups\s+enable row level security/i,
  "learning backups should enable row level security"
);

for (const operation of ["select", "insert", "update"]) {
  assert.match(
    schemaSource,
    new RegExp(`create policy[\\s\\S]+?for ${operation}[\\s\\S]+?auth\\.uid\\(\\)[\\s\\S]+?user_id`, "i"),
    `${operation} should have an authenticated-user ownership policy`
  );
}

assert.match(
  schemaSource,
  /insert into\s+storage\.buckets[\s\S]+?public[\s\S]+?values[\s\S]+?avatars[\s\S]+?true/i,
  "a public avatars bucket should provide stable cross-device profile image URLs"
);

for (const operation of ["insert", "update", "delete"]) {
  assert.match(
    schemaSource,
    new RegExp(
      `create policy[\\s\\S]+?on storage\\.objects[\\s\\S]+?for ${operation}[\\s\\S]+?bucket_id[\\s\\S]+?avatars[\\s\\S]+?auth\\.uid\\(\\)`,
      "i"
    ),
    `${operation} should restrict avatar changes to the authenticated user's own folder`
  );
}

console.log("Supabase schema and public config checks passed");
