import Image from "next/image";

/** รูปบัตรจริง · blank = ต้นขั้วไม่มีเลข (เลขบนบัตรกระดาษได้ตอนรับที่หน้างาน) */
export function TicketArt({
  blank = false,
  priority = false,
  className = "",
}: {
  blank?: boolean;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`ticket-art ${className}`}>
      <Image
        src={blank ? "/images/ticket-blank.png" : "/images/ticket.png"}
        alt={
          blank
            ? "บัตร Lanna Festival Haunted House"
            : "ตัวอย่างบัตร Lanna Festival Haunted House"
        }
        width={1063}
        height={531}
        sizes="(max-width: 800px) 100vw, 760px"
        priority={priority}
      />
    </figure>
  );
}
