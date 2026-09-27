# xian-09-cultivation-ladder

**Status:** ready-for-agent  
**Labels:** ready-for-agent  
**Blockers:** xian-08-xian-feel (แนะนำ)

---

## Problem Statement

ผู้เล่นต้องการให้การขึ้นขั้นฝึกใน Xian IO สะท้อนลำดับจาก *ฝืนลิขิตฟ้าข้าขอเป็นเซียน* ครบถ้วน ไม่ใช่เพียงเจ็ดชื่อย่อ ปัจจุบัน **RealmFloor** จำกัด 1–7 ไม่มี **QiLayer** ในหนิงชี่ (凝气 1–15) และ stat/combat ผูกกับเลขเจ็ด ทำให้ lore ไม่ตรงและขวาง **SkillDraft** ที่อ้างพูลสkillตามขั้น (xian-10)

## Solution

ขยาย **RealmFloor** เป็นแคตตาล็อกยี่สิบห้าขั้นเล่นได้ (รวมแปรผันก้าวตามรายการนิยาย) เพิ่ม **QiLayer** 1–15 เฉพาะขั้นรวมลมปราณ ยังใช้ **CurrentQi** ขับ promotion ตาม ADR 0003 เมื่อ **RealmFloor** ขึ้น (ไม่ใช่เมื่อ QiLayer อย alone) จะไปทริกger **SkillDraft** ใน ticket แยก — ticket นี้โฟกัสแค่ขั้นฝึก stat และ demotion

## User Stories

1. As a player joining a room, I want to start at RealmFloor 1 (หนิงชี่) with QiLayer 1, so that my rank matches the story start.
2. As a player gathering LingqiOrb, I want QiLayer to increase within หนิงชี่ when CurrentQi crosses layer thresholds, so that early progression feels granular across fifteen layers.
3. As a player at QiLayer 15, I want to promote to RealmFloor 2 (筑基) when CurrentQi is sufficient, so that I leave 凝气 properly.
4. As a player, I want promotion from RealmFloor 2 through 25 with Thai names matching the novel ladder, so that HUD and leaderboard show real cultivation titles.
5. As a player, I want `realmDisplayName` to show “รวมลมปราณ · ชั้น N” on floor 1, so that layer is visible during หนิงชี่.
6. As a player, I want MaxQi to depend on QiLayer on floor 1 and on RealmFloor on floor 2+, so that orb caps feel correct at every step.
7. As a player, I want move speed and pickup radius to scale with my effective tier, so that higher cultivation changes feel without breaking early .io pacing.
8. As a player, I want avatar color and size to reflect major cultivation step, so that strong cultivators are recognizable on the map.
9. As a player, I want combat damage rules not to lower RealmFloor or QiLayer except via PocketDuel, so that ADR 0003 still holds.
10. As a player collecting SpiritHerb, I want the same promotion logic as orbs after Qi gain, so that herbs can trigger layer or floor ups.
11. As a player in DemonZone, I want high orb values to make very high floors reachable in long sessions, so that endgame floors are not purely theoretical.
12. As a player losing PocketDuel, I want demotion to follow clear floor/layer rules, so that duel stakes affect rank.
13. As a player at 踏天 (floor 25), I want no further RealmFloor promotion, so that the ladder has an apex.
14. As a player who was demoted, I want my SkillLoadout unchanged (handled in xian-10), so that only rank/Qi punish duel loss.
15. As a player promoting RealmFloor, I want the server to be the only authority on new floor/layer values, so that clients cannot forge rank.
16. As a developer, I want one ordered cultivation catalog (Thai, Chinese, major step, kind), so that UI balance and skill pools share the same floor indices.
17. As a developer, I want `promoteCultivation` and `demoteCultivation` as pure shared functions, so that room code stays thin.
18. As a developer, I want tunable threshold and MaxQi curves in one balance module, so that pacing edits do not scatter.
19. As a developer, I want `effectiveCombatTier(realmFloor, qiLayer)` for legacy combat hooks until skill system replaces DaoPath kits, so that nothing hardcodes seven floors.
20. As a maintainer, I want CONTEXT and spec-xian-io section 4 updated for twenty-five floors and QiLayer, so that agents use correct vocabulary.
21. As a player on transition-themed floors (หยินหยาง, 五衰, 玄劫, 九桥, ยศ), I want them to be normal promotable RealmFloors with thresholds, so that the full list is playable in .io.
22. As a developer, I want invalid realmFloor values to clamp safely in display helpers, so that bad sync state does not crash the client.
23. As a QA tester, I want Vitest proving multi-layer and multi-floor promotion and demotion branches, so that regressions are caught without multiplayer harness.
24. As a player, I want leaderboard sorting by CurrentQi still meaningful at high floors, so that score loop remains the primary .io competition.
25. As a designer, I want early-floor thresholds similar to today’s demo pacing, so that floors 1–8 remain reachable in a short playtest.

## Implementation Decisions

- **Catalog:** Single ordered list of twenty-five **RealmFloor** entries aligned with the grilled novel order (หนิงชี่ through 踏天 including 结婴, yin-yang, nirvana, tribulation, void, titles, bridge). Each entry carries Thai label, Chinese label, major step enum, and kind (cultivation vs transition) for future UI.
- **RealmFloor:** Maximum cultivation floor reached in-room; integer 1…25; monotonic on promotion except PocketDuel demotion.
- **QiLayer:** Integer 1…15; only meaningful when RealmFloor = 1; otherwise synced as 1.
- **Promotion API:** `promoteCultivation(currentQi, realmFloor, qiLayer)` → `{ realmFloor, qiLayer }`. On floor 1, advance QiLayer to 15 by layer thresholds; then advance RealmFloor while CurrentQi meets floor thresholds up to 25. Caller reclamps CurrentQi to `maxQiForRealm(floor, layer)`.
- **Demotion API:** `demoteCultivation(realmFloor, qiLayer)` integrated with PocketDuel loser: floor > 2 → floor−1, qiLayer=1; floor = 2 → floor=1, qiLayer=15; floor = 1 → qiLayer=max(1, qiLayer−1).
- **MaxQi and thresholds:** Programmatic curves extending legacy seven-tier feel for early floors; steeper for 9+; separate NINGQI layer tables for floor 1.
- **Sync schema:** Add **qiLayer** to Player; initialize on join; update wherever promotion/demotion updates RealmFloor today.
- **Server:** Orb and herb pickup invoke shared promotion only; emit state that downstream **SkillDraft** (xian-10) can detect on RealmFloor increase.
- **Client:** HUD and leaderboard use shared display helpers; no DaoPath labels for rank.
- **Interaction with SkillDraft:** RealmFloor promotion triggers draft (xian-10); QiLayer-only changes do not. This ticket does not implement draft UI.
- **Legacy DaoPath:** Unchanged in code until xian-10; do not expand path kits for floors 8+.

## Testing Decisions

- **Good tests:** Assert inputs and outputs of pure functions only — given CurrentQi and rank state, expect new rank, MaxQi cap, and display strings. No Colyseus room ticks, no Phaser.
- **Primary seam (user-confirmed):** Shared package — catalog, `promoteCultivation`, `demoteCultivation`, `maxQiForRealm`, `realmDisplayName`, `effectiveCombatTier`.
- **Prior art:** `qi.test.ts`, `duel.test.ts`, `visual.test.ts`, `daoPath.test.ts` (until DaoPath removal).
- **Not automated:** Reaching floor 25 in a live session; skill draft flows (xian-10).

## Out of Scope

- SkillDraft, CultivationSkill pools, and DaoPath removal (xian-10a, xian-10)
- Cross-session persistence of RealmFloor or QiLayer
- Tribulation as separate minigame instances
- Respawn invulnerability or spawn shield
- Scraping novel sites for lore verification
- More than fifteen QiLayers or sub-layers on non-หนิงชี่ floors

## Further Notes

- ADR 0003 remains authoritative for CurrentQi as life/score.
- Downstream xian-10 depends on stable RealmFloor indices 1–25 matching skill pool keys in xian-10a.
- Optional follow-up: ADR for QiLayer + demotion; UI styling by catalog `kind`.

## Acceptance criteria

- [ ] Twenty-five-step catalog with correct Thai order
- [ ] QiLayer 1–15 on floor 1; floor 2 requires layer 15 + threshold
- [ ] Promotion to floor 25 caps; demotion branches covered by tests
- [ ] Player sync includes qiLayer; HUD shows layer on floor 1
- [ ] Vitest green for shared promotion/demotion/display
- [ ] docs/spec-xian-io §4 and CONTEXT aligned

## Blockers for downstream

- xian-10a skill pool keys must match catalog floor indices
- xian-10 SkillDraft triggers on RealmFloor increase from this ticket
