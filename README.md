# The Haunted House — เว็บขายบัตร

Frontend (Next.js) สำหรับขายบัตรล่วงหน้าบ้านผีสิง: 1 รหัสนักศึกษา = 1 ใบ โอนเงินแล้วแนบสลิป ระบบออกเลขบัตรจาก backend ทันที

## รันในเครื่อง

```sh
cp .env.example .env.local   # ตั้ง NEXT_PUBLIC_API_URL (ค่าเริ่มต้น http://localhost:8080)
npm install
npm run dev
```

เปิด http://localhost:3000 ต้องใช้ Node.js 20.9 ขึ้นไป ถ้าแก้ `NEXT_PUBLIC_API_URL` ต้อง restart หรือ build ใหม่

## หน้าต่าง ๆ

- `/` หน้าแรก
- `/booking` ดูบัตรและวิธีโอน
- `/checkout` กรอกข้อมูลและแนบสลิป แล้วไปที่ `/ticket/{รหัสนักศึกษา}?new=1`
- `/ticket`, `/ticket/[studentId]` ค้นบัตรด้วยรหัสนักศึกษา
- `/admin/login`, `/admin`, `/admin/orders`, `/admin/rejected` หน้าทีมงาน
- `/admin/scan` สแกน QR บนหน้าบัตรเพื่อแจกบัตรวันงาน (กล้องใช้ได้เฉพาะเว็บที่เปิดผ่าน HTTPS — ทดสอบจากมือถือด้วย `npx next dev --experimental-https`)

## ไฟล์ที่ต้องแก้บ่อย

- `lib/event-config.ts` วัน เวลา สถานที่ ราคา และบัญชีรับโอน (ช่องไหนยังไม่ประกาศให้ใส่ "รอประกาศ" หรือปล่อยว่าง)
- `lib/api.ts` เรียก API, จัดการ error และ token แอดมิน
- `lib/api-contract.ts` ตรวจรูปแบบ response

รายละเอียด API และข้อตกลงกับทีม backend อยู่ใน [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md) และ `docs/BACKEND_API.md`

## ลูกเล่นหน้าแรก

หน้าแรก (`/`) มีหน้าประตู เสียงกระซิบ ร่างชุดดำในทุ่งหมอก และกล้องแฟลช ทั้งหมดอยู่ใน `components/scare/` และ `lib/scare/` หน้าอื่นไม่มีลูกเล่นเลย รายละเอียดการออกแบบอยู่ที่ `docs/superpowers/specs/2026-11-08-scare-layer-design.md`

- **เปลี่ยนรูปวันงาน:** วางรูปใน `public/images/` แล้วแก้ `lib/scare/camera-config.ts` ไฟล์เดียว (`pageImages` = รูป hero และรูปเกี่ยวกับงาน, `cameraConfig` = รูปกล้องแฟลช จุดที่ผียืน และกรอบกระจก) พอมีรูปกระจกจริงแล้วให้ตั้ง `mockFrame: false`
- **ทดสอบตั้งแต่ต้น:** ลบ `localStorage` key `hh-entered` (หน้าประตู), `hh-muted` (เสียง), `hh-figure` (ระยะของร่าง) หรือเปิด private window

### รูปที่ต้องถ่ายวันงาน

ตอนนี้ทุกรูปบนหน้าแรกเป็น mock (ไม่ใช่สถานที่จริง)

| รูป                            | ใช้ที่                    | แนะนำ                                                                                                  |
| ------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------ |
| หน้าบ้าน/ทางเข้าตอนกลางคืน     | `pageImages.hero`         | แนวนอน กว้างอย่างน้อย 1920 px มีพื้นที่มืดด้านซ้ายให้วางข้อความ                                        |
| มุมในบ้านที่ดูน่าสนใจ          | `pageImages.story`        | แนวตั้งหรือสี่เหลี่ยม                                                                                  |
| ห้อง/ทางเดินในบ้าน 3 รูปขึ้นไป | `cameraConfig.photos`     | แนวตั้ง ถ่ายตอนไฟมืดแบบวันงาน มีประตูหรือมุมที่ "ผี" ยืนได้ แล้วกำหนด `spots` ให้แต่ละรูป              |
| กระจกบานใหญ่ในบ้าน             | `cameraConfig.mirrorShot` | ถ่ายตรง ๆ ให้เห็นกระจกทั้งบาน ไม่ให้คนถ่ายติดในกระจก แล้วกำหนดกรอบ `mirror` และตั้ง `mockFrame: false` |

## ตรวจก่อน push

```sh
npm run test:booking
npm run test:api
npm run test:scare
npm run test:pickup
npm run lint
npm run typecheck
npm run build
```

`test:api` ใช้ fetch mock ไม่ยิง backend จริง
