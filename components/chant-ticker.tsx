/** บทอิติปิโส (บทสวดดั้งเดิม) — แบบปกติ และแบบถอยหลังอย่างที่ยักษ์สวดในธี่หยด 2 */
const FORWARD =
  "อิติปิโส ภะคะวา อะระหัง สัมมาสัมพุทโธ วิชชาจะระณะสัมปันโน สุคะโต โลกะวิทู อะนุตตะโร ปุริสะธัมมะสาระถิ สัตถา เทวะมะนุสสานัง พุทโธ ภะคะวาติ";
const BACKWARD =
  "ติวาคะภะ โธพุท นังสานุส มะวะเท ถาสัต ถิระสา มะธัม สะริปุ โรตะนุต อะทูวิ กะโลโต คะสุ โนปันสัม ณะระจะ ชาวิช โธพุท สัมมาสัม หังระอะ วาคะภะ โสปิติอิ";

/** แถบวิ่งเลื่อนวนไม่สะดุด: เนื้อหาซ้ำสองชุด แล้วเลื่อนไปครึ่งหนึ่งพอดี */
function Row({ text, back = false }: { text: string; back?: boolean }) {
  const half = (
    <span>
      {text} <i>๏</i> {text} <i>๏</i>{" "}
    </span>
  );
  return (
    <div className={back ? "chant-row back" : "chant-row"}>
      {half}
      {half}
    </div>
  );
}

/** ปิดท้ายหน้าแรก: บนวิ่งไปซ้าย (ถอยหลัง) ล่างวิ่งไปขวา (ปกติ) */
export function ChantTicker() {
  return (
    <section className="chant-band" aria-hidden="true">
      <Row text={BACKWARD} />
      <Row text={FORWARD} back />
    </section>
  );
}
