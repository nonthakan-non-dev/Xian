# xian-10-skill-draft

**Status:** ready-for-agent  
**Labels:** ready-for-agent  
**Blockers:** xian-10a-skill-pools-content (required), xian-09-cultivation-ladder (strongly recommended)

---

## Problem Statement

ระบบ **DaoPath** บังคับเลือกสายเดียวที่ **筑基** ไม่สอดคล้องกับนิยายและไม่ให้ build หลากหลายตามขั้นฝึก ผู้เล่นต้องการตัดสายวิชา แล้วได้ **CultivationSkill** จาก **SkillDraft** ทุกครั้งที่ **RealmFloor** ขึ้น: server สุ่มสามจาก десятьของขั้นที่เพิ่งถึง (ไม่รวมที่อยู่ใน **SkillLoadout** แล้ว) ผู้เล่นเลือกหนึ่งในสามผ่าน modal บังคับ

## Solution

ถอน **DaoPath** / **PathChoice** ออกจาก gameplay แทนด้วย:

- Join ห้อง: **SkillLoadout** ว่าง, **WeakBasic** ในหนิงชี่
- **RealmFloor** ขึ้น (ไม่ draft เมื่อ **QiLayer** เปลี่ยนอย alone): เปิด **SkillDraft**, สุ่มสาม **CultivationSkill**, modal หยุดการต่อสู้/เคลื่อนที่จนเลือก
- สะสม passives; **Shift** ใช้ active ล่าสุดที่เลือก; LMB ใช้ basic กลาง
- Damage จากสkill: แปลง % ATK ในเอกสารเป็นตัวคูณบน Qi damage ที่สเกลจาก **RealmFloor** / skill potency (ไม่มี stat ATK แยก)
- แพ้ **PocketDuel**: demote rank ตาม xian-09 แต่ **ไม่ล้าง** SkillLoadout

## User Stories

1. As a new player in หนิงชี่, I want WeakBasic only and an empty SkillLoadout, so that I gather Qi before my first draft at 筑基.
2. As a player promoting from floor 1 to 2, I want my first SkillDraft from the floor-2 pool, so that 筑基 grants my first real skill.
3. As a player, I want exactly three draft options each promotion, so that the choice is manageable on .io.
4. As a player, I want draft options never include skills I already own, so that duplicates do not appear until pools exhaust (future edge case).
5. As a player, I want a blocking modal until I pick one of three, so that I cannot fight or move while undecided.
6. As a player, I want to see Thai skill names and short descriptions in the modal, so that I can choose meaningfully.
7. As a player, I want my pick appended to SkillLoadout permanently for this room session, so that my build grows each promotion.
8. As a player, I want Shift to cast the last active skill I picked, so that controls stay one basic + one active.
9. As a player, I want passive skills from earlier floors to keep applying, so that stacking rewards long rooms.
10. As a player promoting to floors 3–25, I want drafts from that floor’s pool of ten, so that skills match my cultivation title.
11. As a player, I want the server to reject picks not in my current draft offer, so that cheats cannot grant skills.
12. As a player losing PocketDuel, I want to keep all owned skills while my RealmFloor may drop, so that duel punishes rank not build wipe.
13. As a player joining a new room, I want SkillLoadout empty again, so that each room is a fresh run (no cross-session persistence).
14. As a player, I want HUD to list owned skills or count, so that I see my build at a glance.
15. As a player fighting with Demon or players, I want skill damage to reduce CurrentQi, so that combat rules stay ADR 0003.
16. As a developer, I want draft RNG server-side with offers synced to client, so that all clients see the same three ids.
17. As a developer, I want to remove daoPath, awaitingPathChoice, and four-path UI, so that legacy code paths do not linger.
18. As a developer, I want HerbBuff decoupled from DaoPath with a generic small bonus for MVP, so that herbs still matter post-removal.
19. As a developer, I want incremental skill behavior implementation (start with subset of effect types), so that shipping is possible before all 250 skills are fully simulated.
20. As a developer, I want client messages: server sends draft offers; client sends pick id; server validates and clears awaitingSkillDraft.
21. As a QA tester, I want two clients promoting to verify modal and pick sync, so that multiplayer draft is smoke-tested.
22. As a player, I want basic attack available in หนิงชี่ weaker than post-draft basics, so that Q9 grilled decision holds.
23. As a player with many passives, I want performance stable on .io tick rate, so that stacking does not lag the room.
24. As a designer, I want late-floor actives stronger via potency tier not via separate ATK stat, so that balance stays one-dimensional on Qi.
25. As a maintainer, I want FlyingSwords, Overload, Iron Skin, and path poison treated as legacy removed or mapped to specific CultivationSkill ids, so that no dual combat systems run forever.

## Implementation Decisions

- **Remove:** DaoPath selection modal, path-based combat kit gating, path-specific HerbBuff tables, permanent single-path identity on Player.
- **Player sync shape (conceptual):**
  - `ownedSkillIds: string[]` (order = pick order)
  - `awaitingSkillDraft: boolean`
  - `draftOfferIds: string[]` (length 3 when awaiting)
  - `lastActiveSkillId: string` (updated when picked skill kind is active or hybrid active component)
  - Retain `realmFloor`, `qiLayer`, `currentQi` from xian-09
- **Draft trigger:** On server after `promoteCultivation` increases `realmFloor`, set awaiting, roll three ids from pool[`newFloor`] excluding owned; if fewer than three unowned remain, roll all remaining (edge case for long sessions — document behavior: offer <3).
- **Pick flow:** Client submits skill id; server verifies id ∈ draftOfferIds; append to owned; set lastActive if active; clear awaiting and offers; re-enable combat.
- **Combat model:** WeakBasic constants for floor 1 pre-draft; shared basic after at least one draft or configurable; Shift executes handler registered for lastActiveSkillId; passives applied as modifiers in damage/status pipeline reading ownedSkillIds.
- **Qi scalar:** Shared helper maps design atkPercent + potencyTier + RealmFloor to outgoing CurrentQi damage; no separate ATK stat.
- **Content dependency:** All pool data from xian-10a; no hardcoded four paths.
- **Promotion without draft:** QiLayer-only changes never set awaitingSkillDraft.

## Testing Decisions

- **Good tests:** Pure shared behavior — given pool, owned set, and RNG seed (injectable), roll returns valid unowned ids; pick validation accepts/rejects; damage scalar monotonic with potency; no UI or network.
- **Primary seam (aligned with xian-09 user confirmation):** Shared package only for `rollSkillDraft`, `applySkillPick`, `validatePick`, `qiDamageFromSkill`, and loadout helpers.
- **Prior art:** `daoPath.test.ts` (replacement coverage), `qi.test.ts`, duel demotion tests (loadout unchanged — new assertions in xian-10).
- **Manual:** Two-tab promote to floor 2, modal, pick, Shift fires; optional after automated shared tests pass.

## Out of Scope

- Full simulation of all 250 RPG skills on day one (phase by effect archetype)
- VFX shader tiers, screen-wide 踏天 apocalypse visuals as doc describes
- Skill reroll, respec, or paid refresh
- Draft on QiLayer gain within หนิงชี่
- Wiping SkillLoadout on demotion
- Duplicate pick rank-up
- Cross-room skill persistence

## Further Notes

- Grilled decisions: pool = new floor; no duplicates in offers; modal hard block; join zero skills; demotion keeps loadout; Qi scalar damage.
- Recommend ADR: replace DaoPath with SkillDraft (hard to reverse, surprising to future readers).
- docs/spec-xian-io section 6 (DaoPath) should be rewritten when implementing this ticket.

## Acceptance criteria

- [ ] xian-10a complete
- [ ] DaoPath / PathChoice removed from UX and authoritative combat
- [ ] RealmFloor up → three offers → pick one → loadout grows
- [ ] WeakBasic on floor 1; Shift uses last active
- [ ] Shared Vitest for roll/pick/scalar; manual two-client smoke
- [ ] HerbBuff no longer path-specific (generic MVP ok)

## Blockers for downstream

- Optional: xian-08 polish passes assuming new combat UX
