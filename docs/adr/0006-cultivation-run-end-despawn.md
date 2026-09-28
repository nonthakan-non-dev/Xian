# ADR 0006: CultivationRun ends with despawn (no edge respawn)

## Status

Accepted

## Context

MVP respawned instantly at the map edge with fixed CurrentQi when Qi hit zero. That removed tension from LingqiOrb drops and did not give a natural pause to reflect on the run. We want a RunSummary UI and explicit choices to return to the lobby or start a new run (rejoin) with the same display name.

## Decision

- **RunEnd** when CurrentQi reaches zero: drop LingqiOrb at the death position, send **RunSummary** to that client only, broadcast **playerDeath** for others, then **despawn** (remove Player from room state while the WebSocket may stay open until the client leaves).
- No automatic edge respawn or RESPAWN_QI restore in the shared room.
- **Restart** = client `leave` + `joinOrCreate` with the same name (fresh CultivationRun via `onJoin`).
- **Lobby** = full client teardown (Phaser destroy, join overlay) after `leave`.

Corpse-as-sprite was rejected in favor of despawn to keep leaderboard and combat targeting simple.

## Consequences

- Dead clients spectate until they choose home or restart.
- **DuelZone** glossary rules for “when CurrentQi is empty” remain future work; open-world behavior follows RunEnd + despawn.
- Run stats (peak CurrentQi, survival time) live in server-side run metadata, not synced schema fields.
