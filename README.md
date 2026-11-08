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

## ไฟล์ที่ต้องแก้บ่อย

- `lib/event-config.ts` วัน เวลา สถานที่ ราคา และบัญชีรับโอน (ช่องไหนยังไม่ประกาศให้ใส่ "รอประกาศ" หรือปล่อยว่าง)
- `lib/api.ts` เรียก API, จัดการ error และ token แอดมิน
- `lib/api-contract.ts` ตรวจรูปแบบ response

รายละเอียด API และข้อตกลงกับทีม backend อยู่ใน [FRONTEND_HANDOFF.md](FRONTEND_HANDOFF.md) และ `docs/BACKEND_API.md`

## ตรวจก่อน push

```sh
npm run test:booking
npm run test:api
npm run lint
npm run typecheck
npm run build
```

`test:api` ใช้ fetch mock ไม่ยิง backend จริง
