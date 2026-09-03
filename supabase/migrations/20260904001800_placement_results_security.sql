-- ============================================================================
-- Placement results: remove client write access.
--
-- Placement is authoritative learning-system output, not a user-editable
-- preference. A learner's "start me at N4" moment is a real state change, but
-- it must be recorded by code that has already verified the request -- the
-- attempt belongs to them, the attempt is complete, the placement was actually
-- computed -- not by an open RLS policy that trusts whatever the client sends
-- as a row.
--
-- This migration removes the insert/update policies added in
-- 20260904001600_rls.sql. See docs/DATABASE.md ("Security model — placement
-- results") for the full boundary this establishes, and docs/DIAGNOSTIC.md for
-- where the trusted write path fits into the diagnostic flow.
-- ============================================================================

drop policy if exists "placement_results are insertable by their owner"
  on public.placement_results;

drop policy if exists "placement_results are updatable by their owner"
  on public.placement_results;

-- No insert, update or delete policy remains for any client-facing role. With
-- RLS enabled and no permissive policy for a command, that command is denied
-- for every role that does not bypass RLS. Every write -- computing a
-- placement, and a learner later accepting one -- happens through trusted
-- server-side code (see docs/DATABASE.md), never through a client-issued
-- insert or update. The existing select-own policy is unchanged: a learner
-- can still read their own placement history.
