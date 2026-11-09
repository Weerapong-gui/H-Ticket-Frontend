/** Set the confirmed event details here. Unannounced fields are intentional placeholders. */
export const eventConfig = {
  name: "THE HAUNTED HOUSE",
  type: "งานวันเดียว",
  date: "เสาร์ 14 พ.ย. 2569",
  time: "17:00 น.",
  location: "ลานดาว",
  payment: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    promptPayQr: "",
  },
  ticket: {
    category: "บัตรล่วงหน้า",
    /** ราคาซื้อหน้างาน (ไม่ได้ขายผ่านเว็บ) */
    doorPrice: 40,
    /** โปรเฉพาะในเว็บ: จำนวนคนต้องตรงกับ GROUP_SIZES ใน backend (1, 2, 5) */
    packages: [
      { size: 1, name: "1 คน", price: 35 },
      { size: 2, name: "2 คน", price: 67 },
      { size: 5, name: "5 คน", price: 167 },
    ],
  },
} as const;
