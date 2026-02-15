# Authentication Design Document

**Date:** 2026-02-16
**Status:** Approved
**Author:** Claude Code

## Overview

Add authentication to the OpenFAM web dashboard using Supabase Auth with magic link login. The system supports single-family accounts with public signup.

## Requirements

- Single parent/family account per email
- Magic link authentication (passwordless)
- Protect sensitive pages (profiles, devices, settings)
- Public landing page with visual preview
- Glassmorphism UI design with geometric background forms
- Public signup for new families

## Architecture

### Components

| Component | Responsibility |
|-----------|---------------|
| **Supabase Auth** | User auth, magic links, session management (JWT) |
| **Next.js Middleware** | Route protection, session validation |
| **Auth Pages** | `/login`, `/signup`, `/auth/callback` |
| **Protected Routes** | `/profiles`, `/devices`, `/settings` |
| **Public Routes** | `/` (landing), `/login`, `/signup` |

### Authentication Flow

```
1. User visits protected route → middleware checks session
2. If no session → redirect to /login
3. User enters email → Supabase sends magic link
4. User clicks link → redirect to /auth/callback
5. Supabase sets session cookie → redirect to /profiles
6. Subsequent requests include session cookie
```

## Data Schema

### Supabase Auth Tables (auto-created)

- `auth.users` - User accounts
- `auth.identities` - Identity providers
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - Token refresh

### Custom Table: `family_profiles`

```sql
CREATE TABLE public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS Policies
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own family profile"
  ON public.family_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own family profile"
  ON public.family_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own family profile"
  ON public.family_profiles FOR UPDATE
  USING (auth.uid() = user_id);
```

## Pages & Routes

### Public Routes (No Auth Required)

| Route | Purpose |
|-------|---------|
| `/` | Landing page with demo preview |
| `/login` | Magic link login form |
| `/signup` | Family account creation |
| `/auth/callback` | OAuth/magic link callback |

### Protected Routes (Auth Required)

| Route | Purpose |
|-------|---------|
| `/profiles` | Manage child profiles |
| `/devices` | Device management |
| `/settings` | Dashboard settings |

## UI Design

### Glassmorphism Style

- Translucent backgrounds: `rgba(255, 255, 255, 0.1)`
- Blur effect: `backdrop-filter: blur(12px)`
- Subtle borders: `rgba(255, 255, 255, 0.2)`
- Soft shadows: `0 8px 32px rgba(0, 0, 0, 0.1)`
- High contrast for text readability

### Background

- Animated gradient base
- Geometric floating shapes (circles, squares, blobs)
- Smooth movement animations

### Login Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│              [Gradient + Geometric Forms]                   │
│                                                             │
│                    ┌──────────────────────────┐             │
│                    │ 🪟 Glass Login Card      │             │
│                    │                          │             │
│                    │  Sign in with Magic Link │             │
│                    │                          │             │
│                    │  [Email Input]           │             │
│                    │                          │             │
│                    │  [Send Magic Link]       │             │
│                    └──────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Checklist

### Phase 1: Setup & Configuration
- [ ] Install Supabase client libraries
- [ ] Configure environment variables
- [ ] Set up Supabase project with Auth enabled

### Phase 2: Database
- [ ] Create `family_profiles` table migration
- [ ] Apply RLS policies

### Phase 3: Authentication Pages
- [ ] Create `/login` page with Glassmorphism design
- [ ] Create `/signup` page with family name field
- [ ] Create `/auth/callback` API route
- [ ] Add geometric background component

### Phase 4: Middleware & Protection
- [ ] Implement `middleware.ts` for route protection
- [ ] Create `<ProtectedRoute>` client component
- [ ] Wrap protected pages

### Phase 5: Landing Page Update
- [ ] Add demo preview section with Glassmorphism card
- [ ] Add Sign In / Sign Up CTAs
- [ ] Add geometric background

### Phase 6: Header & User Menu
- [ ] Add `<UserMenu>` dropdown component
- [ ] Show family name when authenticated
- [ ] Sign out functionality

### Phase 7: API Protection
- [ ] Protect API routes (`/api/profiles`, `/api/devices`)
- [ ] Validate JWT on server

### Phase 8: Testing
- [ ] Test magic link flow end-to-end
- [ ] Test route protection
- [ ] Test signup flow
- [ ] Test sign out

## Dependencies

```json
{
  "@supabase/ssr": "^2.x",
  "@supabase/supabase-js": "^2.x"
}
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security Considerations

- All protected routes validated at middleware level
- RLS policies enforced at database level
- HTTPS required for production
- Session cookies are httpOnly and secure
- No sensitive data in client-side storage
