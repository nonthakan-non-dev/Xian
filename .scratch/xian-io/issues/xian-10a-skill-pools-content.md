# xian-10a-skill-pools-content

**Status:** done  
**Labels:** ready-for-agent  
**Blockers:** — (ควรทำคู่ขนานหรือก่อน xian-09 ถ้าต้องการ lock ids)

---

## Problem Statement

**SkillDraft** ต้องสุ่มสาม **CultivationSkill** จากพูลส десятьของแต่ละ **RealmFloor** แต่เอกสารออกแบบ RPG มีพูลครบเพียงบางขั้น (~15 จาก 25) ขั้นเช่น 结婴 หยินหยาง 五衰 ยศ 玄劫 九桥 ยังไม่มี десятьสkill ทำให้ implement xian-10 ถูกบล็อกตามข้อตกลง grill

## Solution

สร้างแหล่งข้อมูลเดียวที่กำหนด **250** **CultivationSkill** (25 floors × 10 skills) ปรับจากเอกสาร *Renegade Immortal Skill Design* ให้เข้ากับ Xian IO: **CurrentQi** เป็นชีวิต, แผนที่ .io, ไม่มี stat ATK แยก — เก็บ potency เป็นตัวคูณที่ xian-10 จะแปลงเป็น Qi damage

## User Stories

1. As a designer, I want exactly ten skills per RealmFloor 1–25, so that draft math is always “three of ten.”
2. As a developer, I want stable unique skill ids across all floors, so that loadouts and sync never collide.
3. As a player, I want Thai skill names consistent with cultivation step names on the same floor, so that lore feels coherent.
4. As a developer, I want each skill tagged passive, active, or hybrid, so that Shift and passives can be wired in xian-10.
5. As a developer, I want potency tier or ATK-percent preserved from the design doc, so that Qi scalar conversion is faithful.
6. As a developer, I want range described in .io-friendly classes (self, line, cone, circle, dash), so that server hit detection can map without meter literals from RPG doc.
7. As a content author, I want to reuse the existing fifteen documented pools where they match catalog floors, so that work is adaptation not rewrite.
8. As a content author, I want clear guidance to invent ten skills for missing floors (结婴, 阴虚, 阳实, 天人五衰, 金尊…踏天九桥), so that gaps are filled systematically.
9. As a developer, I want a validation test that counts ten skills per floor and no duplicate ids, so that content errors fail CI.
10. As a developer, I want floor index to match xian-09 cultivation catalog, so that promotion and pools stay aligned.
11. As a localizer, I want optional English internal names for ids, so that code reviews remain readable.
12. As a balancer, I want early-floor skills weaker in potency tier than late-floor skills on average, so that power curve matches novel phases.
13. As a developer, I want CC types enumerated (stun, slow, pull, silence, etc.) where applicable, so that server status effects can be implemented incrementally.
14. As a player, I want no skill in a pool to be a strict duplicate of another on the same floor, so that draft choices feel distinct.
15. As a maintainer, I want the content file versioned in-repo, so that agents implement against a frozen snapshot.

## Implementation Decisions

- **Deliverable:** One authoritative data module (or generated JSON re-exported) keyed by `realmFloor` 1…25, each value an array of exactly ten skill definitions.
- **Minimum skill record:** `id` (string, globally unique), `nameTh`, `kind`: `passive` | `active` | `hybrid`, `descriptionTh`, `potencyTier` or `atkPercent` from design doc, `rangeClass`, optional `ccType`, optional `cooldownMs` for actives.
- **Naming:** Thai display names primary; ids snake_case or kebab with floor prefix recommended to avoid collisions.
- **Source mapping:** Floors that map 1:1 to design doc sections (หนิงชี่…问鼎, 窥涅…碎涅, 空涅…空劫, 踏天) start from doc lists; compress RPG meters to range classes for .io.
- **Missing floors:** Author new tens for 结婴 (floor 4 in grilled catalog), 阴虚/阳实, 天人五衰, celestial title floors, 玄劫, 踏天九桥 — matching tone and power band of neighboring floors.
- **No runtime behavior in this ticket:** Only data + validation tests; no room combat wiring.
- **HerbBuff and VFX tiers from RPG doc:** Out of scope; data may note `vfxTier` optionally for future art.

## Testing Decisions

- **Good tests:** Structural only — for each floor 1…25, length === 10; all ids unique globally; required fields present; kinds valid enum.
- **Primary seam:** Shared catalog validation module invoked from Vitest (same package as future draft logic).
- **Prior art:** Pattern similar to constant tables tested in `balance.ts` / catalog integrity tests planned for xian-09.
- **Not in scope:** Damage numbers feeling fun in play; only schema integrity.

## Out of Scope

- Implementing SkillDraft roll or combat (xian-10)
- Implementing RealmFloor catalog (xian-09) except using same floor indices
- Full VFX, shaders, camera juice from RPG doc
- Translating entire doc to English UI
- Balance pass in live multiplayer

## Further Notes

- User gate: no xian-10 code until this ticket’s acceptance criteria pass.
- Attach reference: `renegade_immortal_skill_system_design.md` — treat ATK% as input to Qi scalar in xian-10, not as literal HP damage in RPG sense.

## Acceptance criteria

- [ ] 25 floors × 10 skills committed
- [ ] Global id uniqueness test green
- [ ] Floor indices align with xian-09 catalog order
- [ ] Missing novel floors have authored pools, not placeholders

## Blockers for downstream

- xian-10-skill-draft requires this complete
