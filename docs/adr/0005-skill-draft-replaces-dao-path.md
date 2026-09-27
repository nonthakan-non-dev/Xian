# ADR 0005: SkillDraft replaces DaoPath

## Status

Accepted

## Context

DaoPath forced a single permanent class at 筑基. The novel-aligned design gives one **CultivationSkill** per **RealmFloor** promotion via **SkillDraft**.

## Decision

- **SkillLoadout** syncs as comma-separated skill ids on `Player`.
- **RealmFloor** increase opens **SkillDraft** (three offers from that floor’s pool, excluding owned).
- **QiLayer-only** changes never draft.
- Combat uses **WeakBasic** with empty loadout; **Shift** casts **lastActiveSkillId**.
- **HerbBuff** is generic (not path-specific).
- **DaoPath** / **PathChoice** fields removed from schema; legacy helpers in `daoPath.ts` remain only for poison/overload/shield tunables until fully migrated.

## Consequences

- Build diversity per run; duel demotion affects rank only, not loadout.
- Active skill behavior is implemented incrementally by `rangeClass` (not all 250 skills simulated on day one).
