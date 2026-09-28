# Xian IO

ห้องเกม multiplayer บนเว็บ ธีมเทพเซียน — เก็บลมปราณ ขึ้นขั้นฝึก สุ่มเลือกสกิลเมื่อเลื่อนขั้น ต่อสู้และดวลในห้องเดียว

## Language

**CurrentQi**:
พลังปราณปัจจุบันของผู้เล่นในห้อง ใช้เป็นชีวิตและคะแนน
_Avoid_: HP, พลัง (ใน UI แสดงว่า「พลังปราณ」แต่ในโค้ดใช้ CurrentQi)

**RealmFloor**:
ขั้นฝึกสูงสุดที่ผู้เล่นเคยถึงในห้องนี้ (หนึ่งถึงยี่สิบห้า ตามแคตตาล็อก *ฝืนลิขิตฟ้า*)
_Avoid_: ระดับ, Level, Realm อย่างเดียวเมื่อหมายถึง floor

**QiLayer**:
ชั้นย่อยหนิงชี่ (หนึ่งถึงสิบห้า) เฉพาะเมื่อ RealmFloor อยู่ที่ขั้นรวมลมปราณ
_Avoid_: sublevel, ระดับเล็ก

**CultivationSkill**:
วิชา/สกิลหนึ่งรายการจากพูลของขั้นฝึก มีผล passive หรือ active ในการต่อสู้
_Avoid_: spell, ability ทั่วไปเมื่อหมายถึงของขั้นฝึก

**SkillLoadout**:
รายการ CultivationSkill ที่ผู้เล่นเลือกสะสมแล้วในห้อง (เริ่มว่างเมื่อ join)
_Avoid_: deck, loadout ทั่วไป

**SkillDraft**:
ช่วงหลัง RealmFloor ขึ้น — server สุ่มสาม CultivationSkill จากพูลสิบของขั้นที่ถึง (ไม่รวมที่มีแล้ว) ผู้เล่นเลือกหนึ่งจากสามใน modal ก่อนเล่นต่อ
_Avoid_: PathChoice, class select, gacha

**WeakBasic**:
การโจมตีพื้นฐานอ่อนในหนิงชี่ก่อนมีสkill จาก SkillDraft ครั้งแรก
_Avoid_: starter class

**LingqiOrb**:
ลิงหปราณบนแผนที่ เก็บแล้วเพิ่ม CurrentQi
_Avoid_: orb, pickup

**SpiritHerb**:
สมุนไพรหายาก ให้ CurrentQi เล็กน้อยและ HerbBuff
_Avoid_: herb item

**HerbBuff**:
สถานะชั่วคราวหลังเก็บ SpiritHerb โบนัสชั่วคราว (ไม่ผูกสายวิชา)
_Avoid_: buff ทั่วไป

**DaoPath** _(legacy — กำลังถูกแทนที่)_:
สายวิชาเดิมสี่ทาง — จะถูกถอดเมื่อ SkillDraft ใช้งาน
_Avoid_: คลาส, อาชีพ

**PathChoice** _(legacy)_:
ช่วงเลือก DaoPath เดิม — แทนที่ด้วย SkillDraft
_Avoid_: class select

**Challenge**:
คำขอท้าดวลแบบ mutual opt-in ก่อนเข้า PocketDuel
_Avoid_: duel request ทั่วไป

**PocketDuel**:
การดวลสองผู้เล่นใน instance แยก
_Avoid_: arena 1v1

**DuelZone**:
วงมรรตบนแผนที่ กติกา FFA เมื่อ CurrentQi หมด
_Avoid_: PvP zone

**FlyingSwords**:
Passive ของ DaoPath กระบี่บิน กระบี่โคจรโจมตีอัตโนมัติ
_Avoid_: turret

**PathRole**:
บทบาทการต่อสู้ของแต่ละ DaoPath ใน demo (burst, tank, AoE, DoT) — ไม่ได้ออกแบบให้ DPS เท่ากันทุกสาย
_Avoid_: class balance sheet, symmetric TTK

**PoisonDecay**:
กติกาว่า stack พิษลดลงเมื่อไม่ถูก refresh ตามเวลา (ไม่ค้างถาวร)
_Avoid_: debuff timer ทั่วไป

**Overload**:
Passive ของ DaoPath เต๋าอัคนี สะสมแต้มสายฟ้าเพื่อ crit
_Avoid_: combo meter

**Demon**:
อสูร PvE มี CurrentQi เป็นชีวิต ฆ่าแล้วดรอปลิงหปราณ
_Avoid_: mob, monster, NPC enemy

**DemonZone**:
พื้นที่บนแผนที่ที่ spawn อสูรและดรอปดีกว่าแผนที่เปิด
_Avoid_: PvE area, dungeon

**CultivationRun**:
ช่วงเล่นหนึ่งรอบตั้งแต่เข้าห้องจน RunEnd — progress (RealmFloor, SkillLoadout, …) ผูกกับ run นี้
_Avoid_: session, life, respawn loop

**RunEnd**:
เหตุการณ์ที่ CurrentQi ถึงศูนย์ — จบ CultivationRun (ไม่ใช่ disconnect จากห้อง)
_Avoid_: death, game over

**RunSummary**:
ข้อมูลสรุป CultivationRun ที่ server ส่งให้ผู้เล่นที่ RunEnd ก่อน despawn
_Avoid_: death screen, scoreboard

**CultivatorDisplayName**:
ชื่อที่แสดงบน join overlay / HUD / leaderboard — ผู้เล่นพิมพ์เองหรือสุ่มจากคลังคำฝั่ง client; server เก็บสตริงเดียวกันใน `player.name` (สูงสุด 24 ตัวอักษร)
_Avoid_: username, account name
