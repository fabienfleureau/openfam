# Plan: Finalize JSON Migration

**Date:** 2026-02-22
**Status:** In Progress
**Scope:** Complete transition from TOML to JSON across CLI and Agent.

## Overview

While the core implementation has already shifted toward JSON, this plan ensures the transition is complete, consistent, and well-documented. We are moving from `/etc/fam/config.toml` to `/etc/fam/config.json`.

## 1. CLI Refactoring

### Config Manager Cleanup
- [ ] Ensure `ConfigManager` is strictly JSON-only (already mostly done).
- [ ] Add robust error handling for malformed JSON during `serialize` and `parse`.
- [ ] Ensure `Config` TypeScript types exactly match the JSON schema.

### Command Verification
- [ ] `profiles add/remove`: Verify JSON update logic.
- [ ] `devices add/remove`: Verify JSON update logic.
- [ ] `nextdns add/remove`: Verify JSON update logic.
- [ ] `schedule add/remove`: Verify JSON update logic.

### Migration Utility
- [ ] Create a `openfam migrate` command that:
  - Checks for `/etc/fam/config.toml` on the router.
  - Converts it to JSON if found.
  - Backups the old TOML file.
  - Deletes the original TOML after successful verification.

## 2. Router Agent Enhancements

### `jq` Optimization
- [ ] Optimize `parse_profiles` in `agent.sh`. Current implementation uses a while-loop with multiple `jq` calls, which can be slow on embedded hardware. 
- [ ] **Strategy:** Use a single `jq` filter to output all MAC=ID mappings in one pass.

### Dependency Check
- [ ] Update `openfam install` to ensure `jq` is installed on the router (`opkg install jq`).

## 3. Documentation

- [ ] Update all `README.md` files to point to JSON.
- [ ] Update `CLAUDE.md` (Already done).
- [ ] Update any example configurations in the repository.

## 4. Testing

- [ ] Unit tests for `ConfigManager` with complex JSON structures.
- [ ] Integration test: Full CLI-to-Router cycle writing and reading JSON.
- [ ] Agent test: Verify `jq` parsing with large numbers of devices/profiles.
