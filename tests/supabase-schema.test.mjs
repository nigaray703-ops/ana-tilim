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

assert.match(schemaSource, /create table if not exists public\.user_feedback/i, "feedback records should use a private database table");
assert.match(schemaSource, /alter table public\.user_feedback enable row level security/i, "feedback records should enable RLS");
assert.match(schemaSource, /grant insert\s*\([^)]*category[^)]*message[^)]*contact[^)]*edition[^)]*app_version[^)]*\)\s*on public\.user_feedback to anon, authenticated/i, "anonymous and signed-in learners should only insert the permitted feedback columns");
assert.match(schemaSource, /create policy "anonymous feedback insert"[\s\S]*?for insert[\s\S]*?to anon, authenticated[\s\S]*?with check/i, "anonymous feedback should have an insert-only RLS policy");
assert.doesNotMatch(schemaSource, /grant\s+select\s+on\s+public\.user_feedback\s+to\s+anon/i, "anonymous learners must never read feedback records");
assert.match(schemaSource, /create table if not exists public\.feedback_admins[\s\S]*?user_id uuid primary key references auth\.users/i, "feedback administrators should be bound to an authenticated user ID");
for (const operation of ["select", "update"]) {
  assert.match(
    schemaSource,
    new RegExp(`create policy "admin feedback ${operation}"[\\s\\S]*?for ${operation}[\\s\\S]*?is_feedback_admin\\(\\)`, "i"),
    `only a server-registered feedback administrator should ${operation} records`
  );
}
assert.match(schemaSource, /create or replace function public\.is_feedback_admin\(\)[\s\S]*?security definer[\s\S]*?auth\.uid\(\)/i, "the UI should check administrator access without exposing the owner Gmail address");
assert.ok(
  schemaSource.indexOf("create or replace function public.is_feedback_admin()")
    < schemaSource.indexOf('create policy "admin feedback select"'),
  "the server-side administrator helper must exist before RLS policies reference it"
);
assert.match(schemaSource, /char_length\(message\) between 10 and 2000/i, "feedback message length should be enforced in the database");
assert.match(schemaSource, /status text not null default 'new'[\s\S]*?check \(status in \('new', 'reviewed', 'resolved'\)\)/i, "feedback status should use the approved private workflow");
assert.doesNotMatch(schemaSource, /\battachments?\b/i, "feedback schema should not add an attachment field");
assert.doesNotMatch(schemaSource, /bucket_id\s*=\s*['"]feedback['"]/i, "feedback schema should not create a feedback storage bucket");

const notifyPath = "supabase/functions/feedback-notify/index.ts";
assert.ok(fs.existsSync(notifyPath), "the email notification Edge Function should exist");
const notifySource = fs.readFileSync(notifyPath, "utf8");
for (const secretName of ["RESEND_API_KEY", "FEEDBACK_OWNER_EMAIL", "FEEDBACK_WEBHOOK_SECRET"]) {
  assert.ok(notifySource.includes(`Deno.env.get(\"${secretName}\")`), `${secretName} should come from an Edge Function secret`);
}
assert.doesNotMatch(notifySource, /[A-Z0-9._%+-]+@gmail\.com/i, "the owner Gmail address must not be committed to public frontend or function source");
assert.match(notifySource, /x-feedback-webhook-secret/i, "email notifications should reject unsigned webhook calls");
assert.match(notifySource, /https:\/\/api\.resend\.com\/emails/i, "the private function should send the owner email through Resend");
assert.match(notifySource, /Idempotency-Key[\s\S]*?feedback-/i, "webhook retries should not send duplicate owner emails");

console.log("Supabase schema and public config checks passed");
