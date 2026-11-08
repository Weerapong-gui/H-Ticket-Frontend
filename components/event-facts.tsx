import { eventConfig } from "@/lib/event-config";

/** Shared static facts: visitors cannot select or change the event schedule. */
export function EventFacts() {
  return (
    <>
      <div>
        <dt>งาน</dt>
        <dd>{eventConfig.name}</dd>
      </div>
      <div>
        <dt>วันที่</dt>
        <dd>{eventConfig.date}</dd>
      </div>
      <div>
        <dt>เวลา</dt>
        <dd>{eventConfig.time}</dd>
      </div>
      <div>
        <dt>สถานที่</dt>
        <dd>{eventConfig.location}</dd>
      </div>
    </>
  );
}
