# 🍬 753BC Candy Bot

บอทกิจกรรม Trick or Treat "Change Candy to Money" (1 ลูกอม = 1 บาท)
รันแยกกระบวนการจาก LynnBot แต่ใช้ Bot Token / Application เดียวกัน โดยไม่ทับคำสั่งหรือ Interaction ใด ๆ ของบอทเดิม

## คุณสมบัติสำคัญ
- คำสั่ง Slash: `/candy` คำสั่งเดียว รองรับ subcommands: `balance`, `leaderboard`, `history`, `rules`, `redeem`, และหมวดหมู่แอดมิน (`event`, `drop`, `channel`, `give`, `take`, `block`, `unblock`, `panel`, `reload`)
- Interaction Router ตรวจจับเฉพาะ Interaction ที่ขึ้นต้น `candy:` (ไม่ตอบข้ามไปกวน LynnBot)
- Voice Tracker ตรวจจับว่าผู้ใช้อยู่ในห้องพูดคุยเสียงจริงหรือไม่, ดักจับห้อง AFK, และตรวจระยะเวลาขั้นต่ำ
- Budget & Claim Engine แบบ Atomic ป้องกันการแย่งสิทธิ์หรือยอดเงินผิดพลาด
- Embed Service ดึง Template จากฐานข้อมูล Supabase และ Sync ตามการแก้ไขจากหน้าเว็บ

## คำสั่งเริ่มต้น
```bash
# ติดตั้ง dependencies
npm install

# ลงทะเบียนเฉพาะคำสั่ง /candy (ไม่ทับคำสั่งเดิมของ LynnBot)
npm run register

# รันบอทกิจกรรม
npm start
```

