# Xian IO

ห้องเกม multiplayer บนเว็บ ธีมเทพเซียน — เก็บลมปราณ ขึ้นขั้นฝึก เลือกสายวิชา ต่อสู้และดวลในห้องเดียว

## Language

**CurrentQi**:
พลังปราณปัจจุบันของผู้เล่นในห้อง ใช้เป็นชีวิตและคะแนน
_Avoid_: HP, พลัง (ใน UI แสดงว่า「พลังปราณ」แต่ในโค้ดใช้ CurrentQi)

**RealmFloor**:
ขั้นฝึกสูงสุดที่ผู้เล่นเคยถึงในห้องนี้ (หนึ่งถึงเจ็ด)
_Avoid_: ระดับ, Level, Realm อย่างเดียวเมื่อหมายถึง floor

**DaoPath**:
สายวิชาที่เลือกครั้งเดียวเมื่อถึงขั้น「สร้างฐานปราณ」
_Avoid_: คลาส, อาชีพ

**LingqiOrb**:
ลิงหปราณบนแผนที่ เก็บแล้วเพิ่ม CurrentQi
_Avoid_: orb, pickup

**SpiritHerb**:
สมุนไพรหายาก ให้ CurrentQi เล็กน้อยและ HerbBuff
_Avoid_: herb item

**HerbBuff**:
สถานะชั่วคราวหลังเก็บ SpiritHerb โบนัสตาม DaoPath
_Avoid_: buff ทั่วไป

**PathChoice**:
ช่วงที่ผู้เล่นต้องเลือก DaoPath จาก modal หลังขึ้นขั้นสอง
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

**Vassana**:
ค่าดวงชะตาในห้อง ส่งผลโอกาสได้ของดีจาก orb และ herb
_Avoid_: karma, บาป, บุญ

**Demon**:
อสูร PvE มี CurrentQi เป็นชีวิต ฆ่าแล้วดรอปลิงหปราณ
_Avoid_: mob, monster, NPC enemy

**DemonZone**:
พื้นที่บนแผนที่ที่ spawn อสูรและดรอปดีกว่าแผนที่เปิด
_Avoid_: PvE area, dungeon
