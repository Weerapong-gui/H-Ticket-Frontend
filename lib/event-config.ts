/** Set the confirmed event details here. Unannounced fields are intentional placeholders. */
export const eventConfig = {
  name: "THE HAUNTED HOUSE",
  type: "งานวันเดียว",
  date: "รอประกาศ",
  time: "รอประกาศ",
  location: "รอประกาศ",
  payment: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    promptPayQr: "",
  },
  ticket: {
    category: "EARLY BIRD",
    /** โปรเฉพาะในเว็บ: จำนวนคนต้องตรงกับ GROUP_SIZES ใน backend (1, 2, 5) */
    packages: [
      { size: 1, name: "1 คน", price: 35 },
      { size: 2, name: "2 คน", price: 67 },
      { size: 5, name: "5 คน", price: 167 },
    ],
  },
} as const;
