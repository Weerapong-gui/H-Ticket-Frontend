import Image from "next/image";

/** รูปบัตรจริง ถ้าส่ง label มาจะพิมพ์เลขบัตรลงบนต้นขั้วแทน 001 */
export function TicketArt({
  label,
  priority = false,
  className = "",
}: {
  label?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={`ticket-art ${className}`}>
      <Image
        src={label ? "/images/ticket-blank.png" : "/images/ticket.png"}
        alt={
          label
            ? `บัตร Lanna Festival Haunted House เลข ${label}`
            : "ตัวอย่างบัตร Lanna Festival Haunted House"
        }
        width={1063}
        height={531}
        sizes="(max-width: 800px) 100vw, 760px"
        priority={priority}
      />
      {label && (
        <span className="ticket-art-number" aria-hidden="true">
          {label}
        </span>
      )}
    </figure>
  );
}
