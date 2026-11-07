import { eventConfig } from "./event-config";
export type StudentInfo = {
  fullName: string;
  studentId: string;
  phone: string;
};
export type StudentErrors = Partial<Record<keyof StudentInfo, string>>;
export type DemoTicket = StudentInfo & { id: string };
export type DemoBooking = {
  quantity: number;
  reference: string;
  tickets: DemoTicket[];
};
export const emptyStudent: StudentInfo = {
  fullName: "",
  studentId: "",
  phone: "",
};
export const DUPLICATE_ID_ERROR =
  "รหัสนักศึกษาซ้ำในรายการนี้ แต่ละรหัสนักศึกษาจองได้เพียง 1 ใบ";
export const USED_ID_ERROR =
  "รหัสนักศึกษานี้มีการจองตั๋วแล้ว ไม่สามารถจองซ้ำได้";
export const numericOnly = (value: string) => value.replace(/\D/g, "");
export const validQuantity = (quantity: number) =>
  Number.isInteger(quantity) && quantity >= 1 && quantity <= 10;
export const demoTotal = (quantity: number) =>
  eventConfig.ticket.price * quantity;
export const normalizeStudent = (student: StudentInfo): StudentInfo => ({
  fullName: student.fullName.trim(),
  studentId: student.studentId.trim(),
  phone: student.phone.trim(),
});
export function validateStudent(
  info: StudentInfo,
  idLength: number | null = eventConfig.studentIdLength,
): StudentErrors {
  const value = normalizeStudent(info);
  const errors: StudentErrors = {};
  if (!value.fullName) errors.fullName = "กรุณากรอกชื่อ-นามสกุล";
  if (!value.studentId) errors.studentId = "กรุณากรอกรหัสนักศึกษา";
  else if (!/^\d+$/.test(value.studentId))
    errors.studentId = "รหัสนักศึกษาต้องเป็นตัวเลขเท่านั้น";
  else if (idLength !== null && value.studentId.length !== idLength)
    errors.studentId = `กรอกรหัสนักศึกษา ${idLength} หลัก`;
  if (!value.phone) errors.phone = "กรุณากรอกเบอร์โทรศัพท์";
  else if (!/^0[689]\d{8}$/.test(value.phone))
    errors.phone = "กรอกเบอร์มือถือไทย 10 หลัก ที่ขึ้นต้นด้วย 06, 08 หรือ 09";
  return errors;
}
export function validateStudents(
  students: StudentInfo[],
  usedIds: ReadonlySet<string> = new Set(),
  idLength: number | null = eventConfig.studentIdLength,
): StudentErrors[] {
  const counts = new Map<string, number>();
  for (const student of students) {
    const id = student.studentId.trim();
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return students.map((student) => {
    const errors = validateStudent(student, idLength);
    const id = student.studentId.trim();
    if (!errors.studentId) {
      if (usedIds.has(id)) errors.studentId = USED_ID_ERROR;
      else if ((counts.get(id) ?? 0) > 1) errors.studentId = DUPLICATE_ID_ERROR;
    }
    return errors;
  });
}
export const hasStudentData = (student: StudentInfo) =>
  Object.values(student).some((value) => !!value.trim());
export function needsRemovalConfirmation(
  students: StudentInfo[],
  quantity: number,
) {
  return (
    validQuantity(quantity) &&
    quantity < students.length &&
    students.slice(quantity).some(hasStudentData)
  );
}
export function resizeStudents(
  students: StudentInfo[],
  quantity: number,
): StudentInfo[] {
  if (!validQuantity(quantity))
    throw new Error("จำนวนบัตรต้องอยู่ระหว่าง 1–10 ใบ");
  return Array.from({ length: quantity }, (_, index) => ({
    ...(students[index] ?? emptyStudent),
  }));
}
export const maskStudentId = (value: string) => `•••• ${value.slice(-4)}`;
export const maskPhone = (value: string) => `••••••${value.slice(-4)}`;
export function createDemoBooking(
  students: StudentInfo[],
  reference: string,
  ticketIds: string[],
  usedIds: ReadonlySet<string> = new Set(),
): DemoBooking {
  if (
    !validQuantity(students.length) ||
    ticketIds.length !== students.length ||
    new Set(ticketIds).size !== ticketIds.length ||
    ticketIds.some((id) => !id.startsWith("HH-DEMO-TICKET-")) ||
    !reference.startsWith("HH-DEMO-") ||
    validateStudents(students, usedIds).some(
      (errors) => Object.keys(errors).length,
    )
  )
    throw new Error("ข้อมูลการจองเดโมไม่ถูกต้อง หรือมีรหัสนักศึกษาที่จองแล้ว");
  return {
    quantity: students.length,
    reference,
    tickets: students.map((student, index) => ({
      ...normalizeStudent(student),
      id: ticketIds[index],
    })),
  };
}
export const demoQrPayload = (ticketId: string) =>
  `DEMO / NOT VALID FOR ENTRY | ${ticketId}`;
export type DemoState = {
  revision: number;
  students: StudentInfo[];
  completed: DemoBooking | null;
  usedIds: ReadonlySet<string>;
};
export const initialDemoState = (): DemoState => ({
  revision: 0,
  students: [{ ...emptyStudent }],
  completed: null,
  usedIds: new Set(),
});
/** Synchronous revalidation before a single commit prevents repeated issuance inside this demo tab. */
export function confirmDemoState(
  state: DemoState,
  reference: string,
  ticketIds: string[],
): DemoState {
  const booking = createDemoBooking(
    state.students,
    reference,
    ticketIds,
    state.usedIds,
  );
  return {
    ...state,
    completed: booking,
    usedIds: new Set([
      ...state.usedIds,
      ...booking.tickets.map((ticket) => ticket.studentId),
    ]),
  };
}
