import { eventConfig } from "@/lib/event-config";

/** ภาษาที่เว็บรองรับ (หน้าแอดมินเป็นไทยอย่างเดียว) */
export const LANGS = ["th", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "th";
export const LANG_COOKIE = "lang";
export const LANG_NAMES: Record<Lang, string> = { th: "ไทย", en: "English" };

export const isLang = (v: string | undefined | null): v is Lang =>
  !!v && (LANGS as readonly string[]).includes(v);

/** ภาษาจาก path: /en/... = อังกฤษ นอกนั้น (รวม /admin) = ไทย */
export function langFromPath(pathname: string | null | undefined): Lang {
  const seg = pathname?.split("/")[1];
  return isLang(seg) ? seg : DEFAULT_LANG;
}

/** เปลี่ยนภาษาของ path เดิม: /th/booking → /en/booking */
export function swapLang(pathname: string, to: Lang): string {
  const parts = pathname.split("/");
  if (isLang(parts[1])) parts[1] = to;
  else parts.splice(1, 0, to);
  const out = parts.join("/");
  return out.endsWith("/") && out.length > 1 ? out.slice(0, -1) : out;
}

const th = {
  meta: {
    title: "The Haunted House | บ้านผีสิง",
    description: "จองบัตรล่วงหน้าบ้านผีสิง The Haunted House",
    ticketSearch: "ค้นบัตร | The Haunted House",
    yourTicket: "บัตรของคุณ | The Haunted House",
    booking: "จองบัตร | The Haunted House",
    checkout: "กรอกข้อมูลและแนบสลิป | The Haunted House",
  },
  common: {
    skip: "ข้ามไปที่เนื้อหา",
    loading: "กำลังโหลด…",
    book: "จองบัตร",
    remaining: "บัตรคงเหลือ",
    tickets: "บัตร",
    findTicket: "ค้นบัตร",
    home: "หน้าแรก",
    staff: "ทีมงาน",
    menu: "เมนูหลัก",
    openMenu: "เปิดเมนู",
    closeMenu: "ปิดเมนู",
    language: "ภาษา",
    updated: "อัปเดต",
    socialIg: "Instagram องค์การนักศึกษา มฟล.",
    socialFb: "Facebook องค์การนักศึกษา มฟล.",
    mute: "ปิดเสียง",
    unmute: "เปิดเสียง",
    studentIdDigits: "รหัสนักศึกษาต้องเป็นตัวเลข 10 หลัก",
    tenDigits: "ตัวเลข 10 หลัก",
    studentId: "รหัสนักศึกษา",
  },
  event: {
    name: eventConfig.name,
    // eventConfig เป็น as const: แปลงเป็น string ให้ภาษาอื่นใส่ค่าของตัวเองได้
    date: eventConfig.date as string,
    time: eventConfig.time as string,
    location: eventConfig.location as string,
    labels: { name: "งาน", date: "วันที่", time: "เวลา", location: "สถานที่" },
  },
  pkg: {
    name: (size: number) => `${size} คน`,
    perPerson: "ต่อคน",
    tickets: (n: number) => `${n} ใบ`,
    category: "บัตรล่วงหน้า",
    webOnly: "โปรเฉพาะในเว็บ",
    choose: "เลือกโปร",
    notEnough: "บัตรเหลือไม่พอ",
    note: "ราคานี้เฉพาะจองผ่านเว็บ มากันเป็นกลุ่มโอนครั้งเดียวได้ทุกคน วันงานรับบัตรด้วยรหัสนักศึกษา",
  },
  home: {
    subtitle: "บ้านผีสิง",
    tagline: "เข้าไปแล้ว อย่าหันหลังกลับ",
    priceStrip: (web: string, door: string) =>
      `จองเว็บ ${web} / หน้างาน ${door}`,
    quote1: "ผนังบ้านนี้ไม่ได้มีแค่หู",
    quote2: "มันจำทุกอย่างได้",
    ticketsTitle: "บัตรล่วงหน้า",
    doorLead: (door: string) => `ซื้อหน้างานใบละ ${door} จองผ่านเว็บถูกกว่า`,
  },
  counter: {
    label: "บัตร pre-sale",
    low: "ใกล้หมดแล้ว",
    sr: (left: number, total: number) => `เหลือ ${left} จาก ${total} ใบ`,
    of: (total: number) => `/ ${total} ใบ`,
  },
  sales: {
    checking: "กำลังตรวจสอบสถานะการขาย",
    closedForever: "ปิดขายผ่านเว็บแล้ว ซื้อได้ที่หน้างาน",
    soldOut: "บัตรหมดแล้ว",
    notOpen: "ยังไม่เปิดขาย / ปิดขายชั่วคราว",
    open: "เปิดจองบัตรล่วงหน้า",
    retry: "ลองตรวจสอบอีกครั้ง →",
    onePerId: "หนึ่งรหัสนักศึกษาซื้อได้หนึ่งใบ",
    error: "ตรวจสอบสถานะการขายไม่ได้ กรุณาลองใหม่",
  },
  booking: {
    title: "จองบัตร",
    lead: "เลือกโปร โอนเงิน แล้วแนบสลิป วันงานมารับบัตรด้วยรหัสนักศึกษา",
    bought: "ซื้อแล้ว? ค้นบัตรของคุณ →",
    next: "โอนแล้ว ไปแนบสลิป",
    cannotBuy: "ยังซื้อบัตรไม่ได้",
  },
  steps: {
    aria: (step: number) => `ขั้นตอน ${step} จาก 3`,
    labels: ["บัตรและวิธีโอน", "ข้อมูลและสลิป", "ยืนยันการจอง"],
  },
  summary: {
    title: "สรุปการจอง",
    promo: "โปร",
    webOnly: "(เมื่อสั่งซื้อผ่านเว็บเท่านั้น)",
    qty: "จำนวน",
    total: "ยอดโอน",
  },
  payment: {
    aria: "วิธีโอนเงิน",
    pay: "โอนเงิน",
    thenSlip: "แล้วแนบสลิป",
    group: "โอนครั้งเดียวเป็นยอดรวมทั้งกลุ่ม แล้วแนบสลิปใบเดียว",
    bank: "ธนาคาร",
    accountName: "ชื่อบัญชี",
    notAnnounced: "ผู้จัดงานยังไม่ประกาศบัญชีรับโอน",
    qrAlt: "QR พร้อมเพย์สำหรับโอนเงิน",
    slipHint: "ใช้รูปสลิปเต็มใบจากแอปธนาคาร ห้ามครอป ต้องเห็น QR บนสลิป",
    copy: "คัดลอก",
    copied: "คัดลอกแล้ว",
    copyAria: "คัดลอกเลขบัญชี",
    copiedSr: "คัดลอกเลขบัญชีแล้ว",
  },
  checkout: {
    title: "กรอกข้อมูลและแนบสลิป",
    leadOne: "กรอกข้อมูลของคุณและแนบสลิปโอนเงิน ระบบจะยืนยันการจองทันที",
    leadGroup: (n: number) =>
      `กรอกข้อมูลทั้ง ${n} คน แนบสลิปเดียว ระบบจะยืนยันการจองให้ทุกคนทันที`,
    peopleHeading: (n: number) =>
      n > 1 ? `ข้อมูลทั้ง ${n} คน` : "ข้อมูลผู้ซื้อ",
    person: (i: number) => (i === 0 ? "คนที่ 1 (ผู้ซื้อ)" : `คนที่ ${i + 1}`),
    name: "ชื่อ-นามสกุล",
    namePh: "กรอกชื่อ-นามสกุล",
    idHint: "ใช้ค้นบัตรและแลกบัตรจริง",
    phone: "เบอร์โทรศัพท์",
    phoneGroup: "ทีมงานจะติดต่อเบอร์นี้สำหรับทั้งกลุ่ม",
    slipHeading: "สลิปโอนเงิน",
    slipLabel: "รูปสลิป (JPG, PNG, WebP ไม่เกิน 5 MB)",
    slipRule:
      "ใช้รูปสลิปเต็มใบจากแอปธนาคาร ห้ามครอปหรือแคปบางส่วน ต้องเห็น QR บนสลิป",
    slipAlt: "ตัวอย่างสลิปที่เลือก",
    back: "← กลับไปเปลี่ยนโปร",
    checking: "กำลังตรวจสลิป…",
    confirm: "ยืนยันการจอง",
    cannotBuy: "ยังซื้อบัตรไม่ได้",
    final:
      "ตรวจข้อมูลให้ถูกต้องก่อนกด · ซื้อแล้วแก้ไขเองไม่ได้ ต้องติดต่อทีมงาน",
    errName: "กรุณากรอกชื่อ-นามสกุล",
    errNameLong: "ชื่อยาวเกิน 100 ตัวอักษร",
    errDupId: "รหัสนักศึกษาซ้ำกับคนอื่นในกลุ่ม",
    errPhone: "เบอร์โทรต้องเป็นตัวเลข 10 หลัก ขึ้นต้นด้วย 0",
    errSlipMissing: "กรุณาแนบรูปสลิปการโอนเงิน",
    errSlipType: "รองรับรูปสลิป JPG, PNG หรือ WebP เท่านั้น",
    errSlipSize: "รูปสลิปต้องมีขนาดไม่เกิน 5 MB และไม่ใช่ไฟล์ว่าง",
  },
  lookup: {
    title: "ค้นหาบัตรของคุณ",
    lead: "กรอกรหัสนักศึกษาเพื่อดูสถานะการจองและการรับบัตรกระดาษ",
    search: "ค้นบัตร",
    privacy:
      "ผู้ที่ทราบรหัสนักศึกษาสามารถดูชื่อและสถานะการจองได้ โปรดเก็บลิงก์บัตรไว้กับตัว",
    searching: "กำลังค้นหาบัตร…",
    notFound: "ไม่พบบัตรของรหัสนี้",
    aria: "การจองของคุณ",
    success:
      "จองสำเร็จ! บันทึกหน้านี้ไว้ (บุ๊กมาร์กหรือแคปหน้าจอ) ใช้รับบัตรจริงที่หน้างาน",
    pickedUp: "รับบัตรกระดาษแล้ว",
    waiting: "ชำระแล้ว · รอรับบัตรที่หน้างาน",
    group: (n: number) => `ซื้อเป็นกลุ่ม ${n} คน`,
    memberPicked: "รับบัตรแล้ว",
    memberWaiting: "ยังไม่รับ",
    groupNote:
      "แต่ละคนมารับบัตรด้วยรหัสนักศึกษาของตัวเอง หรือผู้ซื้อรับแทนทั้งกลุ่มก็ได้",
    instructions:
      "แสดงหน้าจอนี้กับทีมงานเพื่อแลกบัตรกระดาษ และจะได้เลขบัตรจริง ณ วันงาน",
    refresh: "อัปเดตสถานะบัตร",
    back: "← กลับหน้าซื้อบัตร",
    qrAlt: "QR สำหรับรับบัตร",
    qrCaption: "ยื่น QR นี้ให้ทีมงานสแกนตอนรับบัตร",
    ticketAlt: "บัตร Lanna Festival Haunted House",
    sampleAlt: "ตัวอย่างบัตร Lanna Festival Haunted House",
  },
  errors: {
    contact: "ติดต่อทีมงาน:",
    myTicket: "ดูบัตรของฉัน →",
    findById: "ค้นบัตรด้วยรหัสนักศึกษา →",
  },
  camera: {
    title: "ถ่ายรูปกับผีในบ้านนี้",
    unavailable: "เปิดกล้องไม่ได้ ลองถ่ายบ้านแทน",
    videoAria: "ภาพจากกล้อง",
    resultAlt: "รูปของคุณจากกล้องผี",
    privacy: "รูปอยู่ในเครื่องคุณเท่านั้น ไม่ถูกส่งไปที่ไหน",
    developing: "กำลังล้างฟิล์ม…",
    saveHint: "บันทึกไม่ได้? กดค้างที่รูปแล้วเลือกบันทึกรูปภาพ",
    open: "เปิดกล้อง",
    shutter: "ชัตเตอร์",
    switch: "สลับกล้องหน้าหลัง",
    save: "บันทึกรูป",
    retake: "ถ่ายใหม่",
    mockTitle: "ลองถ่ายรูปบ้านนี้ดู",
    shotAlt: (n: number) => `รูปที่ ${n} จากกล้อง`,
    shotCaption: (n: number) => `รูปที่ ${n}`,
  },
  gate: {
    line: "บ้านหลังนี้มีเสียง ใส่หูฟังจะดีที่สุด",
    enter: "เข้าบ้าน (มีเสียง)",
    quiet: "เข้าแบบไม่มีเสียง",
  },
};

export type Dict = typeof th;

const en: Dict = {
  meta: {
    title: "The Haunted House",
    description: "Book your pre-sale ticket for The Haunted House",
    ticketSearch: "Find your ticket | The Haunted House",
    yourTicket: "Your ticket | The Haunted House",
    booking: "Book tickets | The Haunted House",
    checkout: "Your details & slip | The Haunted House",
  },
  common: {
    skip: "Skip to content",
    loading: "Loading…",
    book: "Book now",
    remaining: "Tickets left",
    tickets: "Tickets",
    findTicket: "Find ticket",
    home: "Home",
    staff: "Staff",
    menu: "Main menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    language: "Language",
    updated: "updated",
    socialIg: "MFU Student Union on Instagram",
    socialFb: "MFU Student Union on Facebook",
    mute: "Mute",
    unmute: "Unmute",
    studentIdDigits: "Student ID must be 10 digits",
    tenDigits: "10 digits",
    studentId: "Student ID",
  },
  event: {
    name: eventConfig.name,
    date: "Sat 14 Nov 2026",
    time: "5:00 PM",
    location: "Lan Dao, MFU",
    labels: { name: "Event", date: "Date", time: "Time", location: "Venue" },
  },
  pkg: {
    name: (size: number) => (size === 1 ? "1 person" : `${size} people`),
    perPerson: "per person",
    tickets: (n: number) => (n === 1 ? "1 ticket" : `${n} tickets`),
    category: "Pre-sale tickets",
    webOnly: "Web-only deal",
    choose: "Choose a deal",
    notEnough: "Not enough tickets left",
    note: "These prices are for web bookings only. Groups pay once for everyone. Pick up your tickets on the day with your student ID.",
  },
  home: {
    subtitle: "Haunted House",
    tagline: "Once you're in, don't look back",
    priceStrip: (web: string, door: string) =>
      `Web ${web} / At the door ${door}`,
    quote1: "These walls don't just listen",
    quote2: "They remember everything",
    ticketsTitle: "Pre-sale tickets",
    doorLead: (door: string) =>
      `${door} at the door. Booking online is cheaper.`,
  },
  counter: {
    label: "Pre-sale tickets",
    low: "Almost gone",
    sr: (left: number, total: number) => `${left} of ${total} tickets left`,
    of: (total: number) => `/ ${total} left`,
  },
  sales: {
    checking: "Checking ticket sales",
    closedForever: "Online sales have ended. Tickets are sold at the door.",
    soldOut: "Sold out",
    notOpen: "Sales are not open yet / paused",
    open: "Pre-sale is open",
    retry: "Check again →",
    onePerId: "One ticket per student ID",
    error: "Can't check ticket sales right now. Please try again.",
  },
  booking: {
    title: "Book tickets",
    lead: "Choose a deal, transfer the money and attach your slip. Pick up your ticket on the day with your student ID.",
    bought: "Already booked? Find your ticket →",
    next: "I've paid, attach the slip",
    cannotBuy: "Tickets unavailable",
  },
  steps: {
    aria: (step: number) => `Step ${step} of 3`,
    labels: ["Tickets & payment", "Details & slip", "Confirmation"],
  },
  summary: {
    title: "Booking summary",
    promo: "Deal",
    webOnly: "(web orders only)",
    qty: "Tickets",
    total: "Amount to pay",
  },
  payment: {
    aria: "How to pay",
    pay: "Transfer",
    thenSlip: "then attach the slip",
    group: "Pay once for the whole group and attach a single slip.",
    bank: "Bank",
    accountName: "Account name",
    notAnnounced: "The payment account has not been announced yet",
    qrAlt: "PromptPay QR for payment",
    slipHint:
      "Use the full slip image from your banking app. Don't crop it. The QR code must be visible.",
    copy: "Copy",
    copied: "Copied",
    copyAria: "Copy account number",
    copiedSr: "Account number copied",
  },
  checkout: {
    title: "Your details & slip",
    leadOne:
      "Enter your details and attach your transfer slip. Your booking is confirmed right away.",
    leadGroup: (n: number) =>
      `Enter details for all ${n} people and attach one slip. Everyone's booking is confirmed right away.`,
    peopleHeading: (n: number) =>
      n > 1 ? `Details for all ${n} people` : "Your details",
    person: (i: number) => (i === 0 ? "Person 1 (buyer)" : `Person ${i + 1}`),
    name: "Full name",
    namePh: "Your full name",
    idHint: "Used to find your ticket and pick it up",
    phone: "Phone number",
    phoneGroup: "Staff will contact this number for the whole group",
    slipHeading: "Transfer slip",
    slipLabel: "Slip image (JPG, PNG, WebP, max 5 MB)",
    slipRule:
      "Use the full slip from your banking app. Don't crop or screenshot part of it. The QR code must be visible.",
    slipAlt: "Selected slip preview",
    back: "← Change deal",
    checking: "Checking slip…",
    confirm: "Confirm booking",
    cannotBuy: "Tickets unavailable",
    final:
      "Check your details before confirming. Bookings can't be edited afterwards; contact staff if needed.",
    errName: "Please enter your full name",
    errNameLong: "Name is longer than 100 characters",
    errDupId: "This student ID is already used by someone else in the group",
    errPhone: "Phone number must be 10 digits starting with 0",
    errSlipMissing: "Please attach your transfer slip",
    errSlipType: "Slip must be a JPG, PNG or WebP image",
    errSlipSize: "Slip must be under 5 MB and not empty",
  },
  lookup: {
    title: "Find your ticket",
    lead: "Enter your student ID to see your booking and paper-ticket pickup status.",
    search: "Search",
    privacy:
      "Anyone who knows your student ID can see your name and booking status. Keep your ticket link to yourself.",
    searching: "Looking up your ticket…",
    notFound: "No booking found for this student ID",
    aria: "Your booking",
    success:
      "Booked! Save this page (bookmark or screenshot) to pick up your ticket on the day.",
    pickedUp: "Paper ticket picked up",
    waiting: "Paid · pick up at the event",
    group: (n: number) => `Group of ${n}`,
    memberPicked: "Picked up",
    memberWaiting: "Not yet",
    groupNote:
      "Each person picks up with their own student ID, or the buyer can collect for the whole group.",
    instructions:
      "Show this screen to staff to collect your paper ticket. Your ticket number is given on the day.",
    refresh: "Refresh status",
    back: "← Back to booking",
    qrAlt: "QR code for ticket pickup",
    qrCaption: "Show this QR to staff when you pick up your ticket",
    ticketAlt: "Lanna Festival Haunted House ticket",
    sampleAlt: "Sample Lanna Festival Haunted House ticket",
  },
  errors: {
    contact: "Contact staff:",
    myTicket: "View my ticket →",
    findById: "Find my ticket by student ID →",
  },
  camera: {
    title: "Take a photo with the ghosts",
    unavailable: "Can't open the camera. Try photographing the house instead.",
    videoAria: "Camera view",
    resultAlt: "Your photo from the ghost camera",
    privacy: "Your photo stays on your phone. Nothing is uploaded.",
    developing: "Developing…",
    saveHint: "Can't save? Press and hold the photo, then choose Save Image.",
    open: "Open camera",
    shutter: "Shutter",
    switch: "Switch front/back camera",
    save: "Save photo",
    retake: "Retake",
    mockTitle: "Try photographing the house",
    shotAlt: (n: number) => `Photo ${n} from the camera`,
    shotCaption: (n: number) => `Photo ${n}`,
  },
  gate: {
    line: "This house has sound. Headphones are best.",
    enter: "Enter (with sound)",
    quiet: "Enter without sound",
  },
};

export const DICTS: Record<Lang, Dict> = { th, en };

/** ข้อความ error จาก backend เป็นไทย: หน้าอังกฤษแปลตามรหัส error */
export const API_ERRORS_EN: Record<string, string> = {
  network:
    "Can't reach the server. Please try again. If you just sent a slip, look up your ticket by student ID before sending again.",
  internal: "Something went wrong. Please try again.",
  invalid_response:
    "The server sent an unexpected reply. Please try again. If you sent a slip, look up your ticket before sending again.",
  invalid_input: "Some details are invalid. Please check and try again.",
  invalid_slip:
    "We couldn't find a valid transfer slip in this image. If you've paid, please contact staff.",
  duplicate_slip:
    "This slip has already been used. If you think this is a mistake, please contact staff.",
  already_has_ticket: "This student ID already has a booking.",
  sales_closed: "Online sales are currently closed.",
  sold_out: "Sorry, there aren't enough tickets left.",
  not_found: "Not found.",
  too_many_attempts: "Too many attempts. Please wait and try again.",
};
