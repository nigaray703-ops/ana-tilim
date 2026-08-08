# International Guest and Google Authentication Design

**Date:** 2026-08-08
**Status:** Approved approach; implementation pending

## Goal

Simplify the international Ana Tilim authentication experience so public users see only two ways to use the product:

1. continue as a local guest without signing in; or
2. sign in with Google for cloud synchronization.

The change applies to the international Vercel build. It must not interrupt guest learning, local progress, Google OAuth, signed-in cloud synchronization, sign-out, or local-record clearing.

## User Experience

### Signed out

The welcome and profile account surfaces will:

- explain that guest progress is stored on the current device;
- retain the existing guest entry action, `无需登录，直接开始学习`;
- show one cloud authentication action, `使用 Google 登录`;
- retain the current local-mode status and `清除学习记录` action where they already appear.

They will not render:

- login/register tabs;
- display-name registration fields;
- email fields;
- password or password-confirmation fields;
- password login or registration buttons;
- email one-time-code controls or status text.

### Signed in with Google

The existing signed-in account summary remains unchanged. It displays the account email and synchronization status and provides `退出登录`. Signing out returns the user to local guest mode without deleting local progress.

## Architecture

`renderCloudAuthPanel()` remains the single renderer used by both the welcome and profile account surfaces. Its signed-out branch will be reduced to a guest explanation, one Google button, and the current cloud-status text. Its signed-in branch remains unchanged.

The click handler for `cloud-google-login`, the OAuth redirect target, session restoration, cloud merge behavior, and sign-out behavior remain unchanged.

Password and email-OTP methods in `cloud-sync.js` remain available internally but become unreachable from the international UI. Keeping these lower-level methods avoids an unrelated authentication-controller migration and preserves future regional flexibility.

## Data and State

No learning snapshot fields, local-storage keys, Supabase tables, or merge rules change.

The existing `authMode`, `authEmail`, and OTP-related state may remain temporarily for backward compatibility, but the international renderer will not expose controls that mutate those fields. No saved learner progress is migrated or discarded.

## Error Handling

Google OAuth errors continue to use the existing toast: `Google 登录暂时不可用，请稍后重试`.

If Supabase is unavailable, the app still starts in local guest mode. Authentication service failure must not block learning or local progress persistence.

## Accessibility and Layout

The Google action remains a semantic button with its existing accessible name. Removing the form and tablist reduces keyboard stops and prevents hidden or inactive email controls from remaining in the accessibility tree.

The simplified panel must fit desktop and 390 × 844 mobile viewports without horizontal overflow or clipped text.

## Testing

Automated render tests will verify that signed-out welcome and profile surfaces:

- contain the guest-learning message and `使用 Google 登录`;
- contain no login/register tabs, email/password inputs, password actions, or email-code actions;
- retain local progress controls;
- preserve the existing signed-in summary and sign-out state;
- preserve the Google OAuth redirect flow.

The full project check will run after implementation. The deployed Vercel site will then be checked on desktop and at 390 × 844 for page rendering, console health, responsive overflow, Google-button visibility, and absence of all removed authentication controls.

## Non-goals

- Do not redesign the rest of the profile page.
- Do not change Supabase configuration or cloud-learning synchronization.
- Do not remove lower-level password or OTP APIs from `cloud-sync.js`.
- Do not implement the separate China build in this change.
- Do not change course content, navigation, learning progress, or the recently deployed brand assets.
