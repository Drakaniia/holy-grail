---
name: integration-vue-3
description: PostHog integration for Vue 3 applications
metadata:
  author: PostHog
  version: 1.26.1
---

# PostHog integration for Vue 3

This skill helps you add PostHog analytics to Vue 3 applications.

## Workflow

Follow these steps in order to complete the integration:

1. `references/1-begin.md` - PostHog Setup - Begin ← **Start here**
2. `references/2-edit.md` - PostHog Setup - Edit
3. `references/3-revise.md` - PostHog Setup - Revise
4. `references/4-conclude.md` - PostHog Setup - Conclusion

## Reference files

- `references/EXAMPLE.md` - Vue 3 example project code
- `references/1-begin.md` - Start the event tracking setup process by analyzing the project and creating an event tracking plan
- `references/2-edit.md` - Implement PostHog event tracking in the identified files, following best practices and the example project
- `references/3-revise.md` - Review and fix any errors in the PostHog integration implementation
- `references/4-conclude.md` - Review and fix any errors in the PostHog integration implementation
- `references/vue-js.md` - Vue.js - docs
- `references/identify-users.md` - Identify users - docs

The example project shows the target implementation pattern. Consult the documentation for API details.

## Key principles

- **Environment variables**: Always use environment variables for PostHog keys. Never hardcode them.
- **Minimal changes**: Add PostHog code alongside existing integrations. Don't replace or restructure existing code.
- **Match the example**: Your implementation should follow the example project's patterns as closely as possible.

## Framework guidelines

- When a reverse proxy is configured, both /static/* AND /array/* must route to the assets origin (us-assets.i.posthog.com or eu-assets.i.posthog.com).

## Identifying users

Identify users during login and signup events. Refer to the example code and documentation for the correct identify pattern for this framework. If both frontend and backend code exist, pass the client-side session and distinct ID using `X-POSTHOG-DISTINCT-ID` and `X-POSTHOG-SESSION-ID` headers to maintain correlation.

## Error tracking

Add PostHog error tracking to relevant files, particularly around critical user flows and API boundaries.
