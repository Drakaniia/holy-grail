# Design Spec: Auth Dialog Modal Redesign

## 1. Overview
This specification details the visual redesign and architectural split of the Signup and Login dialogue modals to match modern, premium design references (`login_reference.png` and `signup_reference.png`).

---

## 2. Layout Structure & UI Designs

### 2.1 Login Mode (1-Column Card)
- **Modal Size:** Centered dialog, maximum width `max-w-[440px]` (`sm:max-w-md`).
- **Styling:** 
  - Dark translucent container background (`bg-[#181616]/95 border border-zinc-800/80 shadow-[0_30px_90px_rgba(0,0,0,0.85)]`).
  - Subtle warm-orange-to-teal gradient overlay at the top.
- **Content:**
  - Header text:
    - `"Welcome back"` (small upper subtitle, `text-xs uppercase tracking-widest text-zinc-500`)
    - `"Sign in to Toolfolio."` (large white heading, `text-3xl font-extrabold`)
    - `"Pick up where you left off with bookmarks, collections, and your account settings."` (description, `text-sm text-zinc-400 mt-2`)
  - A small custom top-right 'x' close button.
  - **Default Social State:**
    - Stacked buttons: Google OAuth (dark bg, white text), GitHub OAuth (dark bg, white text).
    - Stacked "Continue with email" button (envelope icon, dark bg, white text).
  - **Email Form State (Expanded):**
    - Clicking "Continue with email" transitions the form fields (Email, Password) to slide/fade in, replacing the "Continue with email" button.
    - Prominent "Sign in" action submit button.
  - **Footer:** `"New here? Create a free account"` (switches mode to signup).

### 2.2 Signup Mode (2-Column Desktop Grid)
- **Modal Size:** Horizontal grid, maximum width `max-w-[860px]` (`md:max-w-4xl`).
- **Responsive Layout:**
  - **Mobile (<md):** 1-column layout. The left column image is hidden to fit smaller screen sizes.
  - **Desktop/Tablet (>=md):** 2-column grid (`grid-cols-2`).
- **Left Column:**
  - Full-height image block displaying `src/assets/signup_img.png` (`object-cover w-full h-full`).
- **Right Column:**
  - Header text:
    - `"Know What's Next in AI and Software Before Everyone Else."` (large white centered heading, `text-2xl font-bold tracking-tight text-white mb-6`)
  - **Feature Grid:** 2x2 grid of value proposition badges:
    - Sparkles icon + `"AI Search"`
    - Mail icon + `"Weekly Newsletter"`
    - Bookmark icon + `"Save Bookmarks"`
    - Folder icon + `"Create Collections"`
    - *Badges styling:* Dark semi-transparent background (`bg-white/5` or `bg-[#222222]/40`), subtle border, light grey text.
  - **Divider:** `"Create a Free Account"` inside thin horizontal divider lines.
  - **Default Social State:**
    - Side-by-side buttons: Google OAuth (white background, black text) and GitHub OAuth (dark background, white text).
    - Center text button: `"Continue with email ›"` with a chevron.
  - **Email Form State (Expanded):**
    - Transitioning inline to display name, email, password, and confirm-password inputs with a submit button.
  - **Footer:** `"Already have an account? Sign in"` (switches mode to login).

---

## 3. State Management & Transitions

- **`showEmailForm` state:** A reactive boolean (ref) inside the modal logic, resetting to `false` when switching modes.
- **Transitions:** Smooth CSS transitions using `<Transition>` for sliding/fade-in transitions of the email form fields.
- **Form Validation:** Client-side validation of formats and lengths (e.g., minimum 8 character password) returning visual alerts before sending authentication queries.

---

## 4. Component Architecture Split

We split the existing monolithic `AuthCredentialsForm.vue` (~600 lines) into three highly focused components to satisfy codebase health metrics:

1. **`src/components/auth/AuthDialog.vue` (Core Layout Orchestration):**
   - Renders the modal overlay, backdrop blur, backdrop clicks, escape handler, close button, and column layouts.
   - Orchestrates the transitions of layout states (`showEmailForm`).
   - Renders feature badges and local notices.
2. **`src/components/auth/AuthOAuthButtons.vue` (OAuth Button Styling):**
   - Renders Google and GitHub OAuth options.
   - Adjusts visual layouts depending on `mode` (stacked for login, side-by-side for signup, themed background colors).
3. **`src/components/auth/AuthEmailForm.vue` (Form State & Inputs):**
   - Handles email, password, name, password strength bar, confirm password fields.
   - Dispatches authentication calls up to the root orchestrator.
