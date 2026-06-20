# CHATBOT_NOTES.md — Phase 1: Friend Code System

**Status:** Database migration is DONE and deployed to production Supabase project `kidquest`.
**Your job:** Implement the React frontend that calls these existing tables/functions. Do NOT write any SQL or modify the database — it's already live.

---

## What already exists in Supabase (do not recreate)

### Tables

- `public.friend_codes` — `user_id` (PK, FK→auth.users), `code` (text, unique, 6 chars), `created_at`
- `public.friendships` — `id` (PK uuid), `requester_id`, `target_id`, `status` ('pending'|'accepted'|'rejected'), `created_at`, `responded_at`

### View

- `public.my_friends` — already filtered by RLS to the logged-in user. Columns: `friendship_id`, `friend_user_id`, `friend_name`, `created_at`, `responded_at`. Only contains `status = 'accepted'` rows.

### RPC functions (call via `supabase.rpc(...)`)

1. **`ensure_friend_code(p_user_id uuid)`** → returns `text` (the code)
   - Idempotent. Call once right after a user's first egg is created.
   - Generates a permanent 6-char code (charset excludes O/0, I/1, L — kid-safe, no ambiguous chars).

2. **`send_friend_request(p_code text)`** → returns table `(friendship_id uuid, status text)`
   - The ONLY way to look up another user — by exact code match.
   - Handles: code not found (raises exception), self-friend attempt (raises exception), existing pending/accepted relationship (returns existing row instead of duplicating).
   - Auth required (`auth.uid()` used internally as requester).

3. **`respond_friend_request(p_friendship_id uuid, p_accept boolean)`** → returns `text` (new status: 'accepted' or 'rejected')
   - Only callable by the `target_id` of a pending request.
   - Raises exception if not authorized or already resolved.

### Direct table reads (RLS-protected, safe to query directly)

- `select * from friend_codes where user_id = auth.uid()` → get my own code to display
- `select * from friendships where target_id = auth.uid() and status = 'pending'` → incoming requests to show "Accept/Reject" UI for
- `select * from friendships where requester_id = auth.uid() and status = 'pending'` → outgoing requests I'm waiting on (show "Pending..." state)
- `select * from my_friends` → my accepted friends list

---

## UI / UX requirements

**Core safety rule: no browsing, no search, no user list anywhere.** The only way to add a friend is typing in a code given to you outside the app (verbally, or shown by the friend on their own screen).

### Screens to build

1. **My Code screen** (in profile/settings area)
   - Big, friendly display of the user's own code (e.g. large pixel-font text, maybe with a "copy" button)
   - Call `ensure_friend_code` on mount if no code is cached yet, otherwise just read from `friend_codes`
   - Simple flavor text like "Share this code with a friend so they can add you!"

2. **Add Friend screen**
   - 6-character input (auto-uppercase, restrict to the kid-safe charset if you want client-side validation, but server is authoritative)
   - Submit → `send_friend_request(code)`
   - Handle responses:
     - success + status 'pending' → show "Request sent! Waiting for them to accept."
     - success + status 'accepted' (already friends) → show "You're already friends!"
     - error "Code not found" → friendly "Hmm, that code doesn't match anyone. Double-check it!"
     - error "Cannot friend yourself" → friendly "That's your own code, silly!"

3. **Friend Requests screen** (incoming)
   - List rows from `friendships` where `target_id = me` and `status = 'pending'`
   - For each: show requester's name (you'll need to join/fetch `eggs.child_name` for `requester_id`, since `my_friends` view only covers accepted ones — either extend a similar view or do a client-side fetch per row)
   - Accept / Reject buttons → `respond_friend_request(id, true/false)`
   - On accept, refresh the friends list

4. **My Friends screen**
   - Query `my_friends` view directly
   - Show as a simple list/grid with friend names (pixel UI style, consistent with rest of KidQuest)
   - This is also where future features (compare creatures, visit, battle a friend, etc.) would hook in — not in scope for Phase 1, just display for now

### Visual style

Follow existing KidQuest pixel art conventions: Press Start 2P font (English), Sarabun (Thai), hard shadows, zero border-radius, no soft gradients.

---

## Edge cases to handle gracefully

- User has no code yet (new account, first session) → auto-generate via `ensure_friend_code` before showing "Add Friend" or "My Code" screens
- Network/RPC errors → don't crash, show a simple retry-friendly message (this is a kids' app — never show raw error text or stack traces)
- Empty states: no friends yet, no pending requests yet — both need friendly empty-state copy/illustration, not a blank screen

## Explicitly out of scope for this phase

- No friend-vs-friend battles yet
- No chat/messaging between friends
- No "remove friend" UI yet (can be added later — table supports it via a future delete/status policy, not built yet)
- No leaderboards or friend comparison screens yet

---

## Reference: full SQL already deployed

See `friend_system_migration.sql` (already run in Supabase SQL Editor, production). If you need to double check exact column names or constraints, that file is the source of truth — do not re-run it, just reference it.
