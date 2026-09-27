/**
 * Generates packages/shared/src/cultivationSkillCatalog.ts
 * Run: node packages/shared/scripts/generate-skill-catalog.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../src/cultivationSkillCatalog.ts");

/** @typedef {"passive"|"active"|"hybrid"} Kind */
/** @typedef {"self"|"single"|"line"|"cone"|"circle"|"dash"|"global"} Range */

/**
 * @param {number} floor
 * @param {Array<[string,string,Kind,string,string,number,Range,string?,number?]>} rows
 * slot nameTh, nameEn, kind, descTh, atk, range, cc?, cd?
 */
function floor(floor, rows) {
  return rows.map(([nameTh, nameEn, kind, descriptionTh, atkPercent, rangeClass, ccType, cooldownMs], i) => {
    const slot = i + 1;
    const id = `rf${String(floor).padStart(2, "0")}_s${String(slot).padStart(2, "0")}`;
    const base = {
      id,
      realmFloor: floor,
      nameTh,
      nameEn,
      kind,
      descriptionTh,
      atkPercent,
      rangeClass,
    };
    if (ccType) base.ccType = ccType;
    if (kind === "active" || kind === "hybrid") {
      base.cooldownMs = cooldownMs ?? 2800;
    }
    return base;
  });
}

const FLOORS = [
  floor(1, [
    ["คลื่นปราณผ่าอากาศ", "Qi Slash", "active", "ยิงคลื่นลมปราณเป็นแนวเส้นตรง", 120, "line"],
    ["ดรรชนีลมปราณ", "Qi Index Finger", "active", "กระสุนปราณเจาะเป้าหมายเดี่ยว", 180, "single"],
    ["เกราะลมปราณ", "Qi Shield", "passive", "โล่รับความเสียหายชั่วคราว", 0, "self"],
    ["ศรปราณกระจาย", "Scatter Qi Arrows", "active", "ยิงศรปราณห้าดอกเป็นกรวย", 45, "cone"],
    ["ลมปราณสืบเท้า", "Qi Dash", "active", "พุ่งไปข้างหน้าโจมตีเส้นทาง", 50, "dash"],
    ["หัตถ์ปราณรวบรวม", "Qi Hand Grab", "active", "ดึงศัตรูเข้าหาตัว", 80, "single", "pull"],
    ["ระเบิดปราณรอบกาย", "Qi Burst", "active", "ผลักศัตรูรอบตัว", 100, "circle", "knockback"],
    ["คมมีดลมปราณหมุน", "Spinning Qi Blade", "active", "มีดปราณหมุนรอบตัว", 30, "circle"],
    ["ปราณรักษาจิต", "Qi Heal", "passive", "ฟื้นฟูพลังปราณเล็กน้อย", 0, "self"],
    ["มหาศรปราณทะลวง", "Giant Qi Spear", "active", "หอกปราณขนาดใหญ่แนวเส้นตรง", 350, "line"],
  ]),
  floor(2, [
    ["คมดาบฐานราก", "Foundation Blade", "active", "ฟันดาบพลังงานโค้งกว้าง", 220, "cone"],
    ["ย่างก้าวข้ามมิติสั้น", "Blink Step", "active", "วาร์ปไปจุดเป้าหมาย", 100, "dash"],
    ["กรงขังปราณดิน", "Earth Foundation Cage", "active", "ตรึงศัตรูในวง", 80, "circle", "root"],
    ["หอกปราณปฐพี", "Earth Spike Shower", "active", "หนามหินผุดจากพื้น", 250, "circle"],
    ["โล่ปราณศิลา", "Stone Citadel", "passive", "ลดความเสียหายที่ได้รับ", 0, "self"],
    ["กระแสลมปราณคุ้มคลั่ง", "Qi Frenzy", "passive", "เพิ่มความเร็วเคลื่อนที่ชั่วคราว", 0, "self"],
    ["ดรรชนีสะบั้นฐานราก", "Foundation Breaker Finger", "active", "โจมตีจุดอ่อน", 300, "single"],
    ["วงรำดาบปราณ", "Circle of Blades", "active", "ดาบปราณหมุนรอบตัว", 60, "circle"],
    ["ฝนกระสุนปราณ", "Qi Rain", "active", "กระสุนปราณตกใส่พื้นที่", 40, "circle"],
    ["ปราณกระแทกเมฆา", "Cloud Shatter Impact", "active", "ช็อกเวฟรอบตัว", 400, "circle", "stun"],
  ]),
  floor(3, [
    ["เพลิงแกนทองคำ", "Golden Core Flame", "active", "เพลิงแกนทองเป็นเส้นตรง", 280, "line"],
    ["แกนทองสะท้อนเวท", "Core Mirror", "passive", "สะท้อนความเสียหาย", 0, "self"],
    ["รังสีทองคำระเบิด", "Golden Radiance", "active", "แสงทำลายรอบตัว", 320, "circle", "blind"],
    ["ดาบแกนทองบิน", "Flying Core Sword", "active", "ดาบบินพุ่งชนเป้า", 450, "single"],
    ["แรงกดดันแกนทอง", "Golden Core Pressure", "active", "สโลว์ศัตรูในพื้นที่", 120, "circle", "slow"],
    ["แกนทองหมุนเวียน", "Core Energy Cycle", "passive", "ฟื้นพลังปราณเร็วขึ้น", 0, "self"],
    ["ศรแกนทองทะลวงดวงดาว", "Star Piercer Arrow", "active", "ศรความเร็วสูง", 500, "line"],
    ["โล่แกนทองคำ", "Golden Dome", "passive", "บาเรียให้ตนเอง", 0, "self"],
    ["แกนทองจุติ", "Core Descent", "active", "ทุบพื้นจากอากาศ", 520, "circle"],
    ["ระเบิดแกนทองเทียน", "Pseudo-Core Detonation", "active", "ระเบิดแกนทองเทียน", 650, "circle"],
  ]),
  floor(4, [
    ["ร่างอมย่อยวิญญาณ", "Soul Embryo Seed", "passive", "เพิ่มพลังโจมตีเล็กน้อย", 0, "self"],
    ["หัตถ์หล่อร่างทารก", "Embryo Forming Hand", "active", "บีบอัดปราณเป็นร่างทารกโจมตี", 580, "single"],
    ["เสียงร้องทารกปราณ", "Embryo Cry", "active", "คลื่นเสียงหยุดศัตรูชั่วคราว", 420, "cone", "silence"],
    ["โล่ร่างจำลอง", "Embryo Shell", "passive", "ลดความเสียหายครั้งแรก", 0, "self"],
    ["ดูดแกนปลูกร่าง", "Core Implant Drain", "active", "ดูดพลังปราณเป้าเดี่ยว", 360, "single", "drain"],
    ["ประทานร่างแยก", "Embryo Avatar Strike", "active", "ร่างแยกโจมตีวง", 480, "circle"],
    ["คลื่นทารกปราณ", "Embryo Pulse", "active", "คลื่นปราณแนวตรง", 520, "line"],
    ["รักษาร่างทารก", "Embryo Mend", "passive", "ฟื้นพลังปราณเมื่อไม่ได้รับดาเมจ", 0, "self"],
    ["ระเบิดร่างเทียน", "Embryo Detonation", "active", "ระเบิดร่างเทียนใส่ศัตรู", 720, "circle"],
    ["จุติทารกปราณ", "Embryo Ascension", "active", "ปลดปล่อยพลังทารกปราณ", 880, "circle"],
  ]),
  floor(5, [
    ["ถอดจิตถอนวิญญาณ", "Nascent Soul Emergence", "passive", "เพิ่มโจมตีและหลบหนึ่งครั้ง", 0, "self"],
    ["หัตถ์วิญญาณคว้าดารา", "Soul Grasp", "active", "มือวิญญาณบีบเป้า", 550, "single", "silence"],
    ["ร่างอวตารวิญญาณ", "Soul Avatar Slash", "active", "ฟันต่อเนื่องสามครั้ง", 600, "cone"],
    ["คลื่นทำลายวิญญาณ", "Soul Shatter Wave", "active", "คลื่นทำลายจิต", 480, "cone"],
    ["เขตแดนวิญญาณสั่นสะเทือน", "Soul Domain Shock", "active", "ลดการป้องกันศัตรูในวง", 150, "circle"],
    ["ย้ายจิตสลับร่าง", "Soul Swap", "active", "สลับตำแหน่งกับศัตรู", 200, "single", "confusion"],
    ["เข็มพิษวิญญาณ", "Nascent Needle", "active", "เข็มล่องหน", 400, "single"],
    ["โล่คุ้มกันวิญญาณ", "Soul Aegis", "passive", "ต้าน debuff ชั่วคราว", 0, "self"],
    ["ระเบิดเพลิงวิญญาณ", "Soul Flame Explosion", "active", "เพลิงวิญญาณในวง", 700, "circle"],
    ["จุติวิญญาณก่อกำเนิด", "Nascent Soul Burst", "active", "ระเบิดวิญญาณรอบตัว", 850, "circle"],
  ]),
  floor(6, [
    ["เจตจำนงสังหาร", "Kill Intent Aura", "active", "ออร่าข่มขวญ", 300, "circle", "fear"],
    ["ดรรชนีแปลงเทพ", "Divine Transformation Finger", "active", "นิ้วยักษ์กดจากฟ้า", 800, "circle"],
    ["อาณาเขตสัจธรรม", "Domain of Intent", "passive", "เพิ่มดาเมจในพื้นที่ตนเอง", 0, "circle"],
    ["ฝูงดาบเจตจำนง", "Intent Sword Swarm", "active", "ดาบเจตจำนงถล่มพื้นที่", 840, "circle"],
    ["ก้าวข้ามมิติแปลงเทพ", "God Shift", "active", "วาร์ปอมตะช่วงเคลื่อนที่", 0, "dash"],
    ["หมัดแปลงเทพสยบฟ้า", "Divine Transformation Fist", "active", "หมัดลมยักษ์", 750, "line", "knockback"],
    ["เกราะเจตจำนงสัจธรรม", "Intent Barrier", "passive", "แปลงดาเมจบางส่วนเป็นฟื้น", 0, "self"],
    ["สายฟ้าสัจธรรม", "Rule Lightning", "active", "สายฟ้าสัจธรรม", 900, "single"],
    ["ตัดลำนำชีวิต", "Life Severing Wave", "active", "คลื่นตัดพลังปราณโดยตรง", 600, "cone"],
    ["มหันตภัยแปลงเทพ", "Divine Cataclysm", "active", "บีบอัดมิติระเบิด", 1100, "circle"],
  ]),
  floor(7, [
    ["ปราณเซียนจุติ", "Immortal Qi Transformation", "passive", "เพิ่มดาเมจทั้งหมดชั่วคราว", 0, "self"],
    ["ดาบปราณเซียนสลายนภา", "Immortal Qi Blade", "active", "คลื่นดาบเซียน", 950, "line"],
    ["ฝ่ามือวิญญาณแปรผัน", "Soul Morph Hand", "active", "ฝ่ามือยักษ์ตะปบ", 880, "circle", "stun"],
    ["หอกเซียนทะลวงฟ้า", "Celestial Spear", "active", "หอกแสงจากฟ้า", 1200, "single"],
    ["เกราะปราณเซียนไร้พ่าย", "Immortal Body", "passive", "ลดความเสียหายอย่างมาก", 0, "self"],
    ["ระเบิดคลื่นปราณเซียน", "Immortal Qi Burst", "active", "คลื่นพลังรอบตัว", 900, "circle", "knockback"],
    ["ฝนดาบเซียนหมื่นเล่ม", "Immortal Sword Rain", "active", "ฝนดาบถล่มพื้นที่", 1200, "circle"],
    ["สายฟ้าเซียนแปดทิศ", "8-Direction Lightning", "active", "สายฟ้าแปดทิศ", 850, "circle"],
    ["ดรรชนีเซียนสยบศัตรู", "Celestial Index Finger", "active", "นิ้วเซียนทลายเกราะ", 1000, "single"],
    ["มหาจุติแปรผันวิญญาณ", "Immortal Soul Metamorphosis", "active", "ร่างเซียนระเบิด", 1500, "circle"],
  ]),
  floor(8, [
    ["ดรรชนีถามสวรรค์", "Heaven Asking Finger", "active", "นิ้วจากชั้นเมฆ", 1400, "circle"],
    ["ดาบเทวะตัดดารา", "Ascendant Star Cutter", "active", "ดาบสpectrum", 1600, "line"],
    ["เขตแดนถามสวรรค์", "Ascendant Realm", "active", "ตรึงศัตรูในวง", 500, "circle", "immobilize"],
    ["ฝ่ามือเทวะสยบปฐพี", "Heavenly Ascendant Palm", "active", "ฝ่ามือจากฟ้า", 1500, "circle", "slow"],
    ["ก้าวย่ำสวรรค์", "Heaven Step", "active", "วาร์ปคลื่นความเสียหาย", 800, "dash"],
    ["เนตรเทวะสะท้อนโลก", "Ascendant Eye", "active", "ลบบัฟศัตรู", 600, "cone"],
    ["ลมพายุเทวะ", "Ascendant Tempest", "active", "พายุหมุนพุ่งไปข้างหน้า", 200, "line"],
    ["โล่เทวะนิรันดร์", "Ascendant Shield", "passive", "รอดจากมรณะหนึ่งครั้ง", 0, "self"],
    ["หอกเทวะผ่ามิติ", "Dimensional Ascendant Spear", "active", "หอกทะลุมิติ", 1800, "line"],
    ["มหาเพลิงเทวะเผาสวรรค์", "Ascendant World Inferno", "active", "เพลิงเทวะรอบตัว", 2200, "circle"],
  ]),
  floor(9, [
    ["หมอกหยินเทียน", "Yin Veil", "passive", "ลดระยะที่ศัตรูมองเห็น", 0, "self"],
    ["ดรรชนีหยินกัดจิต", "Yin Mind Finger", "active", "โจมตีจิตทำให้เงียบ", 2100, "single", "silence"],
    ["คลื่นดูดหยิน", "Yin Drain Wave", "active", "ดูดพลังปราณในวง", 900, "circle", "drain"],
    ["เงาหยินสกัดกั้น", "Yin Barrier Field", "passive", "สะท้อน debuff บางส่วน", 0, "circle"],
    ["เข็มหยินล่องหน", "Hidden Yin Needle", "active", "เข็มไร้เสียง", 2400, "single"],
    ["กรงหยินกักวิญญาณ", "Yin Soul Cage", "active", "กักศัตรูในวง", 700, "circle", "root"],
    ["ฝ่ามือหยินเสื่อมถอย", "Yin Decay Palm", "active", "ทำให้ศัตรูอ่อนแอ", 2600, "circle", "slow"],
    ["ปรanหยินฟื้น", "Yin Recovery", "passive", "ฟื้นพลังเมื่ออยู่นิ่ง", 0, "self"],
    ["พายุหยินกลืน", "Yin Devour Storm", "active", "พายุหยินดูด", 1800, "circle"],
    ["มหาหยินเทียน", "Supreme Yin", "active", "ปลดพลังหยินเต็mที่", 3200, "circle"],
  ]),
  floor(10, [
    ["เปลวหยางแรgเริg", "Yang Surge", "passive", "เพิ่มดาเมจโจมตีแรg", 0, "self"],
    ["หมัดหยางถล่m", "Yang Smash Fist", "active", "หมัดพลังหยาง", 2800, "line", "knockback"],
    ["เพลิงหยางแท้", "True Yang Flame", "active", "เพลิงเผาแนวตรง", 3000, "line"],
    ["ลำแสงหยางทะลวง", "Yang Piercing Beam", "active", "ลำแสงเจาะเป้า", 3400, "single"],
    ["ระเบิดหยางรอบกาย", "Yang Body Burst", "active", "ระเบิดรอบตัว", 2600, "circle"],
    ["เกราะหยางแท้", "True Yang Armor", "passive", "ลดดาเมจชั่วคราว", 0, "self"],
    ["ก้าวหยางไฟ", "Yang Fire Step", "active", "dash ทิ้งเพลิง", 2200, "dash"],
    ["ฝnดาบหยาง", "Yang Blade Rain", "active", "ดาบแสงถล่mวง", 3600, "circle"],
    ["สายฟ้aหยาง", "Yang Lightning", "active", "สายฟ้aหยาง", 3800, "circle"],
    ["มหาหยางแท้", "Supreme Yang", "active", "ปลดพลังหยางสุด", 4200, "circle"],
  ]),
  floor(11, [
    ["เนตรส่องนิพพาน", "Nirvana Eye", "passive", "เพิ่มโอกาสคริt", 0, "self"],
    ["ดรรชนีส่องสัจธรรม", "Nirvana Glimpse Finger", "active", "ลำแสงสัจธรรม", 2000, "line"],
    ["ดาบส่องนิพพาน", "Nirvana Glimpse Blade", "active", "ดาบสัจธรรม", 1800, "cone"],
    ["อาณaเขตนิพพานส่องสว่าง", "Illuminated Domain", "active", "พื้นที่ฟื้นและดาเมจ", 300, "circle"],
    ["ฝ่ามือส่องนิพพาน", "Glimpse Palm", "active", "ฝ่ามือสัจธรรม", 2200, "circle"],
    ["ย่างก้าวส่องนิพพาน", "Nirvana Step", "active", "dash ทิ้งภาพลวง", 900, "dash"],
    ["เกราะส่องนิพพาน", "Glimpse Armor", "passive", "สะท้อน debuff", 0, "self"],
    ["ศรนิพพานแทงใจ", "Nirvana Heart Arrow", "active", "ศรแทงใจ", 2400, "single"],
    ["คลื่นสลายสัจธรรม", "Law Shatter Wave", "active", "ทำลายโล่ศัตรู", 1500, "circle"],
    ["ปลุกสัจธรรมนิพพาน", "Nirvana Awakening", "active", "ปลดพลังสัจธรรม", 3000, "circle"],
  ]),
  floor(12, [
    ["เพลิงชำระนิพพาน", "Purifying Flame", "active", "เพลิงชำระวง", 2500, "circle"],
    ["ดรรชนีชำระมลทิn", "Purification Finger", "active", "ลำแสงบริสุทธิ์", 2800, "line"],
    ["วารีชำระนิพพาน", "Purifying Wave", "active", "คลื่นน้ำสัจธรรม", 2200, "cone", "knockback"],
    ["กระจกชำระวิญญาณ", "Soul Purifying Mirror", "active", "เงียบเป้า", 1800, "single", "silence"],
    ["เขตแดนชำระบริสุทธิ์", "Pure Domain", "active", "ล้าง debuff บนพื้น", 800, "circle"],
    ["ดาบชำระบาป", "Sin Cleaving Blade", "active", "ดาบแสง", 3000, "line"],
    ["โล่ชำระสัจธรรม", "Purify Shield", "passive", "แปลงดาเมจเป็นพลัง", 0, "self"],
    ["สายฟ้aชำระสวรรค์", "Purifying Lightning", "active", "สายฟ้aบริสุทธิ์", 3200, "circle"],
    ["ฝ่ามือชำระฟ้a", "Cleansing Heaven Palm", "active", "ฝ่ามือยักษ์", 3500, "circle"],
    ["มหาชำระนิพพานจุติ", "Grand Cleansing Cataclysm", "active", "คลื่นชำระ", 4200, "circle"],
  ]),
  floor(13, [
    ["หมัดสลายนิพพาน", "Shattering Nirvana Fist", "active", "หมัดแตกมิติ", 3800, "line"],
    ["ดรรชนีสลายมิติ", "Shatter Dimension Finger", "active", "ระเบิดมิตi", 4500, "single"],
    ["ดาบสลายสัจธรรม", "Shatter Law Blade", "active", "ฟันทำลายกฎ", 4000, "cone"],
    ["เขตแดนสลายร่าง", "Shatter Domain", "active", "ศัตรูรับดาเมjเพิ่ม", 1000, "circle"],
    ["ก้าวมิติทะลวงสลาย", "Shatter Step", "active", "วาร์ปทุบพื้น", 3200, "dash"],
    ["ฝ่ามือสลายนภa", "Shattered Sky Palm", "active", "ทำลายการป้องกัน", 4800, "circle"],
    ["เกราะสลายความแค้n", "Shatter Retaliation", "passive", "ระเบิดเมื่อโดนตีหนัก", 5000, "circle"],
    ["ศรสลายนิพพาน", "Shatter Arrow", "active", "ศรแตกเป็นสายฟ้a", 1500, "line"],
    ["วงแหวnสลายนิพพาน", "Shatter Ring", "active", "วงแหวnขยาย", 4200, "circle"],
    ["มหาการสลายนิพพาน", "Total Nirvana Shatter", "active", "ทำลายมิตiรอบตัว", 6000, "circle"],
  ]),
  floor(14, [
    ["ด่านเสื่อมถaยแรg", "First Decay Gate", "active", "แลกพลังโจมตีแรg", 5200, "single"],
    ["คำสาปห้aเสื่อม", "Five Decay Curse", "active", "debuff รุนแรgวง", 2800, "circle", "slow"],
    ["ฟ้aผ่aเสื่อมถaว", "Decaying Lightning", "active", "สายฟ้aเสื่อมถaว", 4500, "circle"],
    ["เลือดแลกสวรรค์", "Heaven Blood Bargain", "passive", "ดาเมjเพิ่มแต่โจมตีแรg", 0, "self"],
    ["มือเสื่อมถaว", "Decay Grasp", "active", "ดึงและดูดพลัง", 3600, "single", "drain"],
    ["ระเบิดเสื่อมถaว", "Decay Detonation", "active", "ระเบิดแลกพลังตnเอง", 6200, "circle"],
    ["โล่รับเครaะห์", "Tribulation Shield", "passive", "รับดาเมjครั้งเดียvแล้วแตg", 0, "self"],
    ["คลื่นเสื่อมสวรรค์", "Heaven Decay Wave", "active", "คลื่น true damage", 5000, "cone"],
    ["ดาวตกเสื่อม", "Decaying Meteor", "active", "อุกกaบaตเสื่อม", 5800, "circle"],
    ["มหาเครaะห์ห้aเสื่อม", "Grand Five Decay", "active", "ปลดเครaะห์เต็m", 7500, "circle"],
  ]),
  floor(15, [
    ["คลื่นสุญญะ", "Void Nirvana Wave", "active", "คลื่นสุญญะ", 5500, "cone"],
    ["ดรรชนีสุญญะ", "Void Finger", "active", "ดรรชนีลบ", 7000, "single"],
    ["หลuมดำสุญญะ", "Void Nirvana Orb", "active", "ดึงศัตรูเข้aกลาง", 4000, "circle", "pull"],
    ["ดาบสุญญะตัดกaลเวลa", "Void Time Blade", "active", "หยุดเวลaชั่วคราว", 6200, "line", "stun"],
    ["อาณaเขตสุญญะกลืนกิn", "Void Devouring Domain", "active", "ดูดพลังในวง", 1200, "circle", "drain"],
    ["ฝ่ามือสุญญะเบียดมิติ", "Void Press Palm", "active", "ทุบบีบอaกาศ", 6800, "circle"],
    ["ก้าวไร้ตัวตน", "Void Phase Step", "passive", "อmตะสั้นๆ", 0, "self"],
    ["ศรสุญญนิพพาน", "Void Arrow", "active", "ศรทะลuทุกตัวในเส้น", 6000, "line"],
    ["โล่สุญญะสลายพลัง", "Void Absorb Shield", "passive", "ดูดดาเมjเป็นเกรaะ", 0, "self"],
    ["มหาระเบิดสุญญนิพพาน", "Void Nirvana Extinction", "active", "ลบล้างพื้นที่", 9000, "circle"],
  ]),
  floor(16, [
    ["สุญญะวิญญาณไร้ลักษณ์", "Ether Spirit Form", "passive", "ต้าน physical ชั่วคราว", 0, "self"],
    ["ดรรชนีสุญญะวิญญาณ", "Ether Spirit Finger", "active", "โจมตีวิญญาณ", 8500, "single"],
    ["ดาบตัดสปิริต", "Soul Ether Blade", "active", "ฟันตัดพลังเวท", 7500, "cone"],
    ["เสียงร่ำไห้สุญญะวิญญาณ", "Ether Wail", "active", "สตaนวงกว้าง", 6500, "circle", "stun"],
    ["กรงขังสุญญะวิญญาณ", "Ether Prison", "active", "ขังเป้า", 5000, "single", "banish"],
    ["ฝ่ามือสุญญะวิญญาณ", "Ether Palm", "active", "ฝ่ามือโปร่งแสง", 8000, "circle"],
    ["พายุสุญญะวิญญาณ", "Ether Storm", "active", "พายุหมuน", 2500, "line"],
    ["ย่างก้าวสุญญะวิญญาณ", "Ether Step", "active", "วาร์ปร่างแยg", 0, "dash"],
    ["โล่สุญญะวิญญาณคุ้mภัย", "Ether Ward", "passive", "สะท้อนดาเมjสั้นๆ", 0, "self"],
    ["มหาจุติสุญญะวิญญาณ", "Ethereal Soul Annihilation", "active", "ทำลายวิญญาณรอบตัว", 11000, "circle"],
  ]),
  floor(17, [
    ["สัจธรรมเร้nลับ", "Profound Mystery Law", "active", "สลับกฎในวง", 7000, "circle", "confusion"],
    ["ดรรชนีสุญญะเร้nลับ", "Profound Void Finger", "active", "นิ้วจากมิตi", 11000, "single"],
    ["ดาบเร้nลับสลายนภa", "Profound Arcane Blade", "active", "คลื่นดาบ", 10000, "line"],
    ["หัตถ์เร้nลับกุmดารa", "Profound Hand of Cosmos", "active", "มือบีบวง", 12000, "circle"],
    ["เขตแดนสุญญะเร้nลับ", "Profound Realm", "passive", "ลดคูลดาวnสkill", 0, "self"],
    ["ก้าวข้aมมิติเร้nลับ", "Profound Step", "active", "วาร์ปไกล", 5000, "dash"],
    ["ศรเร้nลับปักสัจธรรม", "Profound Arrow", "active", "ศรตามเป้า", 10500, "single"],
    ["โล่เร้nลับนิรaนดร์", "Profound Barrier", "passive", "บaเรียหนa", 0, "self"],
    ["ฝnดาวตกเร้nลับ", "Profound Meteor Shower", "active", "ฝnอุกกaบaต", 2500, "circle"],
    ["มหานตภัยสุญญะเร้nลับ", "Profound Void Apocalypse", "active", "ฉีกมิตi", 15000, "circle"],
  ]),
  floor(18, [
    ["ฟ้aผ่aเครaะห์เร้nที่หนึ่ง", "Mystic Tribulation I", "active", "สายฟ้aทอง", 12000, "circle"],
    ["ฟ้aผ่aเครaะห์เร้nที่สอง", "Mystic Tribulation II", "active", "สายฟ้aดำ", 13000, "circle"],
    ["วงเครaะห์เก้aด่าน", "Ninefold Tribulation Ring", "passive", "เพิ่มต้anทาน debuff", 0, "self"],
    ["ดาบเครaะห์เร้n", "Mystic Tribulation Blade", "active", "ดาบตัดเครaะห์", 14000, "line"],
    ["มือเครaะห์บดขยี้", "Tribulation Crush Hand", "active", "บดขยี้วง", 15000, "circle"],
    ["ลมปรaณเครaะห์", "Tribulation Qi Storm", "active", "พายุเครaะห์", 9000, "circle"],
    ["โล่ผ่aเครaะห์", "Tribulation Survivor Shield", "passive", "ฟื้นหลังโดนตาย", 0, "self"],
    ["ดาวระเบิดเครaะห์", "Tribulation Star Burst", "active", "ดาวระเบิด", 16000, "circle"],
    ["คลื่นเร้nลับทองดำ", "Gold-Black Arcane Wave", "active", "คลื่นสองสี", 14500, "cone"],
    ["มหาเครaะห์เร้nลับ", "Grand Mystic Tribulation", "active", "ปลดเก้aเครaะห์", 18000, "circle"],
  ]),
  floor(19, [
    ["คลื่นพลังสุญญกaลป์", "Void Aeon Wave", "active", "คลื่นกaลป์", 13000, "cone"],
    ["ดรรชนีดับกaลป์", "Aeon Extinction Finger", "active", "นิ้วกaลเวลa", 18000, "single"],
    ["ดาบสุญญกaลป์ไร้พ่าย", "Aeon Blade", "active", "ดาบตัดกaลเวลa", 16000, "line"],
    ["หัตถ์ดับสูnกaลป์", "Aeon Destruction Hand", "active", "บดขยี้วง", 17000, "circle"],
    ["เขตแดนดับกaลป์", "Aeon Void Realm", "active", "สโloว์90%", 2000, "circle", "slow"],
    ["ก้าวข้aมกaลป์", "Aeon Dash", "active", "dash หยุดเวลa", 8000, "dash", "stun"],
    ["ศรสุญญกaลป์สังหาร", "Aeon Slaying Arrow", "active", "ศรระเบิดมิตi", 19000, "circle"],
    ["โล่กaลป์ดับสูn", "Aeon Immortal Shield", "passive", "อmตะและฟื้น", 0, "self"],
    ["สายฟ้aสุญญกaลป์", "Aeon Void Lightning", "active", "สายฟ้aทำลายกฎ", 20000, "circle"],
    ["มหาล้างโลกสุญญกaลป์", "Aeon Void Oblivion", "active", "ทลายล้างกว้าง", 25000, "global"],
  ]),
  floor(20, [
    ["รaังสีเจ้าทองคำ", "Golden Sovereign Aura", "passive", "ออร่aเจ้าทอง", 0, "self"],
    ["ดาบจินจุn", "Golden Sovereign Blade", "active", "ดาบทอง", 22000, "line"],
    ["ฝ่ามือเจ้าทอง", "Golden Sovereign Palm", "active", "ฝ่ามือทอง", 24000, "circle"],
    ["เขตแดnเจ้าทอง", "Golden Sovereign Domain", "passive", "เพิ่มดาเมjในวง", 0, "circle"],
    ["ศรทองคำ", "Golden Sovereign Arrow", "active", "ศรทอง", 26000, "single"],
    ["เกรaะทองคำ", "Golden Sovereign Barrier", "passive", "บaเรียทอง", 0, "self"],
    ["สายฟ้aทอง", "Golden Sovereign Lightning", "active", "สายฟ้aทอง", 28000, "circle"],
    ["ก้าวทองคำ", "Golden Sovereign Step", "active", "dash ทอง", 18000, "dash"],
    ["ระเบิดทองคำ", "Golden Sovereign Burst", "active", "ระเบิดทอง", 30000, "circle"],
    ["มหาเจ้าทองคำ", "Supreme Golden Sovereign", "active", "ปลดพลังทอง", 35000, "circle"],
  ]),
  floor(21, [
    ["ออร่aเทียnจุn", "Heavenly Venerable Aura", "passive", "ข่มขvncขั้นต่ำกว่า", 0, "self"],
    ["ดรรชนีเทียnจุn", "Heavenly Venerable Finger", "active", "นิ้วสวรรค์", 32000, "single"],
    ["ดาบเทียnจุn", "Heavenly Venerable Blade", "active", "ดาบสวรรค์", 34000, "line"],
    ["เขตแดnเทียnจุn", "Heavenly Venerable Domain", "active", "พื้นที่สวรรค์", 8000, "global"],
    ["ฝnมือเทียnจุn", "Heavenly Venerable Palm", "active", "ฝnมือยักษ์", 36000, "circle"],
    ["โล่เทียnจุn", "Heavenly Venerable Shield", "passive", "บaเรียสวรรค์", 0, "self"],
    ["พายุเทียnจุn", "Heavenly Venerable Tempest", "active", "พายุสวรรค์", 12000, "line"],
    ["ศรเทียnจุn", "Heavenly Venerable Arrow", "active", "ศรสวรรค์", 38000, "single"],
    ["สายฟ้aเทียnจุn", "Heavenly Venerable Lightning", "active", "สายฟ้a", 40000, "circle"],
    ["มหาเทียnจุn", "Supreme Heavenly Venerable", "active", "ปลดเทียnจุn", 45000, "circle"],
  ]),
  floor(22, [
    ["จaนทrเทียnจุn", "Lunar Venerable Halo", "passive", "พลังจaนทr", 0, "self"],
    ["ดาบจaนทr", "Lunar Venerable Blade", "active", "ดาบจaนทr", 42000, "line"],
    ["ฝnมือจaนทr", "Lunar Venerable Palm", "active", "ฝnมือแสงจaนทr", 44000, "circle"],
    ["เขตแดnจaนทr", "Lunar Domain", "active", "พื้นที่จaนทr", 10000, "circle", "slow"],
    ["ศรจaนทr", "Lunar Arrow", "active", "ศรจaนทr", 46000, "single"],
    ["โล่จaนทr", "Lunar Ward", "passive", "บaเรียจaนทr", 0, "self"],
    ["ก้าวจaนทr", "Lunar Step", "active", "dash จaนทr", 22000, "dash"],
    ["พายุจaนทr", "Lunar Storm", "active", "พายุแสง", 14000, "circle"],
    ["ระเบิดจaนทr", "Lunar Burst", "active", "ระเบิดแสง", 48000, "circle"],
    ["มหาจaนทrเทียnจุn", "Supreme Lunar Venerable", "active", "ปลดจaนทr", 52000, "circle"],
  ]),
  floor(23, [
    ["ออร่aมหาเทียnจุn", "Grand Venerable Aura", "passive", "ข่มขvncสูงสุด", 0, "self"],
    ["ดรรชนีมหาเทียnจุn", "Grand Venerable Finger", "active", "นิ้vมหา", 50000, "single"],
    ["ดาบมหาเทียnจุn", "Grand Venerable Blade", "active", "ดาบมหา", 52000, "line"],
    ["เขตแดnมหา", "Grand Venerable Domain", "active", "พื้นที่มหา", 15000, "global"],
    ["ฝnมือมหาเทียnจุn", "Grand Venerable Palm", "active", "ฝnมือมหา", 54000, "circle"],
    ["โล่มหา", "Grand Venerable Shield", "passive", "บaเรียมหา", 0, "self"],
    ["สายฟ้aมหา", "Grand Venerable Lightning", "active", "สายฟ้aมหา", 56000, "circle"],
    ["ศรมหา", "Grand Venerable Arrow", "active", "ศรมหา", 58000, "single"],
    ["ระเบิดมหา", "Grand Venerable Nova", "active", "ระเบิดมหา", 60000, "circle"],
    ["ต้aเทียnจุnจuติ", "Grand Venerable Ascendance", "active", "ปลดมหาเทียnจุn", 65000, "global"],
  ]),
  floor(24, [
    ["สะพานแรg", "First Heaven Bridge", "passive", "เพิ่มระยaสkill", 0, "self"],
    ["สะพานที่สอง", "Second Heaven Bridge", "passive", "ลดคูลดาวn", 0, "self"],
    ["สะพานที่สาม", "Third Heaven Bridge", "passive", "เพิ่มต้aนทan debuff", 0, "self"],
    ["ก้าวสะพานที่สี่", "Fourth Bridge Step", "active", "dash ข้aมสะพาน", 28000, "dash"],
    ["คลื่นสะพานที่ห้a", "Fifth Bridge Wave", "active", "คลื่นสะพาน", 32000, "line"],
    ["ดาบสะพานที่หก", "Sixth Bridge Blade", "active", "ดาบสะพาน", 36000, "line"],
    ["สายฟ้aสะพานที่เจ็d", "Seventh Bridge Lightning", "active", "สายฟ้a", 40000, "circle"],
    ["โล่สะพานที่แปd", "Eighth Bridge Shield", "passive", "บaเรียสะพาน", 0, "self"],
    ["ระเบิดสะพานที่เก้a", "Ninth Bridge Detonation", "active", "ระเบิดสะพาน", 48000, "circle"],
    ["ย่ำเก้aสะพาน", "Tread Nine Bridges", "active", "ปลดสะพานครบ", 55000, "global"],
  ]),
  floor(25, [
    ["ย่ำสวรรค์สะเทือnจักรวาล", "Heaven Treading Step", "active", "คลืnทั้งแผnที่", 30000, "global", "stun"],
    ["ดรรชnีย่ำสวรรค์", "Heaven Treading Finger", "active", "นิ้vทะลuมิตi", 40000, "line"],
    ["ดาบสัจธรรมย่ำสวรรค์", "Heaven Treading Dao Blade", "active", "ตัดมิตi", 35000, "cone"],
    ["หัตถ์กุmจักรวาล", "Cosmic Hand of Dao", "active", "มือจักรวาล", 45000, "circle"],
    ["อาณaจักรย่ำสวรรค์", "Heaven Treading Domain", "active", "วิถีเต๋a", 5000, "global"],
    ["ลบล้aงความตาย", "Erase Reality", "active", "ประหารเป้aอ่อน", 0, "single", "execute"],
    ["เกรaะกฎเกณฑ์ย่ำสวรรค์", "Absolute Law Shield", "passive", "อmตะสูง", 0, "self"],
    ["ศรสร้างดวงดาว", "Star Creation Arrow", "active", "ระเบิดกaแล็กซี่", 50000, "circle"],
    ["ย่างก้าวข้aมภพภูมi", "Omnipresent Step", "active", "วาร์ปทั่วแผnที่", 20000, "global"],
    ["ฝืnลิขิตฟ้a", "Heaven Defying Metamorphosis", "active", "ultimate", 100000, "global"],
  ]),
];

const all = FLOORS.flat();
if (all.length !== 250) {
  throw new Error(`Expected 250 skills, got ${all.length}`);
}

const header = `/** Auto-generated — do not edit by hand. Run: node packages/shared/scripts/generate-skill-catalog.mjs */
import type { CultivationSkillDef } from "./cultivationSkillTypes.js";

export const SKILL_CATALOG: readonly CultivationSkillDef[] = `;

writeFileSync(outPath, `${header}${JSON.stringify(all, null, 2)} as const;\n`);

console.log(`Wrote ${all.length} skills to ${outPath}`);
