# Frontend integration handoff

> Checkout ใช้ระบบจริงแล้ว: 1 รหัสนักศึกษา = 1 ใบ ส่ง `POST /api/orders` พร้อมสลิป แล้วพาไปหน้า `/ticket/{student_id}?new=1` (โหมดเดโม 1–10 ใบถูกเอาออก)

เอกสารอ้างอิง: `docs/BACKEND_API.md` — ฝั่ง backend ดูแลโดยอีกทีม งานใน repository นี้เป็น frontend เท่านั้น

## การตั้งค่าที่ทีม frontend ใช้

- Frontend dev origin: `http://localhost:3000`
- API default: `http://localhost:8080`
- เปลี่ยน URL ผ่าน `NEXT_PUBLIC_API_URL` ใน `.env.local` แล้ว restart / rebuild frontend
- ฝั่ง backend ต้องตั้ง `CORS_ORIGIN` ให้ตรงกับ origin ของ frontend
- ข้อมูลวัน เวลา สถานที่ ราคา และบัญชีรับโอน: `lib/event-config.ts`
- วัน เวลา สถานที่ และบัญชีรับโอนที่ยังไม่ให้มา จะไม่ถูกสร้างขึ้นเอง

## เส้นทางที่พร้อมเชื่อมต่อ

| Frontend                   | API                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `/booking` และ `/checkout` | `GET /api/sales`                                                                      |
| `/checkout`                | `POST /api/orders` multipart: `name`, `student_id`, `phone`, `slip`                   |
| `/ticket/[studentId]`      | `GET /api/tickets/{student_id}`                                                       |
| `/admin/login`             | `POST /api/admin/login`                                                               |
| `/admin`                   | `GET /api/admin/stats`, `PUT /api/admin/sales`, `POST /api/admin/sales/close-forever` |
| `/admin/orders`            | `GET /api/admin/orders`, authenticated slip, cancel และ pickup                        |
| `/admin/rejected`          | `GET /api/admin/rejected`, authenticated rejected slip                                |

Frontend รองรับ error code ตามเอกสาร พร้อม `contact`, `ticket_label`, `retry_after_secs` และกลับหน้า login เมื่อ admin API ตอบ 401

## ข้อตกลงสำคัญ

- หนึ่งรหัสนักศึกษาซื้อได้หนึ่งใบ ไม่มี quantity 1–10 ใน flow จริง
- ชื่อไม่ว่างและยาวไม่เกิน 100 ตัวอักษร รหัสนักศึกษา 10 หลัก เบอร์โทร 10 หลักขึ้นต้นด้วย 0
- ส่งรูปสลิปต้นฉบับ JPG/PNG/WebP ไม่เกิน 5 MB โดยไม่บีบอัด ย่อ หรือครอป และไม่กำหนด multipart Content-Type เอง
- เลขบัตรต้องมาจาก backend เท่านั้น เช่น `ticket_no: 12` และ `ticket_label: "012"` ไม่สร้างเลขหรือ QR เดโมทดแทน
- Frontend ตรวจรูปแบบ response ตามสัญญา ถ้าข้อมูลไม่ครบจะแสดงข้อผิดพลาดแทนการแสดงเลขบัตรหรือสถิติผิด
- คำขอมี timeout 20 วินาที รวมถึงคำขอที่มี cancellation signal หากผลซื้อบัตรไม่ชัดเจนจะแนะนำให้ค้นบัตรก่อนส่งซ้ำ
- หลังส่งสลิปสำเร็จ ปุ่มจะคงสถานะรอจนเปลี่ยนหน้าสำเร็จ เพื่อป้องกันการส่งซ้ำระหว่าง navigation
- เมื่อโหลดข้อมูลแอดมินใหม่ จะไม่ค้างเลขบัตรว่างชุดเก่าไว้ให้ใช้งาน
- ระบบอ่าน QR บนสลิป แต่ไม่ได้ยืนยันยอดโอนหรือบัญชีปลายทางตามข้อจำกัดในเอกสาร backend

## การตรวจสอบใน frontend โดยไม่ต้องรัน backend

```sh
npm run test:booking
npm run test:api
npm run lint
npm run typecheck
npm run build
```

API tests ใช้ fetch mock ใน process ทดสอบเท่านั้น ไม่มี mock backend server ไม่มีการแก้ backend และไม่มีการส่งคำสั่งซื้อจริง ครอบคลุม buyer/admin endpoints, multipart bytes, error/contact, 429, 401, รูปแบบ response ที่ไม่ครบ และ timeout/cancellation

## รอบทดสอบร่วมเมื่อทีม backend ส่ง service มา

1. ให้ทีม backend ยืนยัน API URL, CORS origin และข้อมูลสำหรับ test environment
2. ตรวจ `GET /healthz` แล้วทดสอบสถานะยังไม่เปิดขาย / เปิดขาย / ขายหมด / ปิดถาวร
3. ทดสอบซื้อด้วยข้อมูลนักศึกษาสมมติและ fixture slip ของ backend ตรวจเลขบัตรจาก POST เทียบ GET ticket
4. ทดสอบรหัสซ้ำ สลิปซ้ำ สลิปอ่านไม่ได้ และข้อความติดต่อทีมงาน
5. ทดสอบดูสลิปแอดมิน รับบัตร/ยกเลิกรับ ยกเลิกบัตร แล้วตรวจสถานะหน้าผู้ซื้อ
6. ตรวจ session หมดอายุและ rate limit
7. ทดสอบปิดถาวรใน test environment เท่านั้น พร้อมคำยืนยัน `ปิดถาวร`

การทดสอบร่วมเหล่านี้ยังไม่ได้อ้างว่าผ่านกับ service จริง
