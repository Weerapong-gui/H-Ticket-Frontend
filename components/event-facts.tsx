import { eventConfig } from "@/lib/event-config";

/** Shared static facts: visitors cannot select or change the event schedule. */
export function EventFacts() {
  return (
    <>
      <div>
        <dt>Event</dt>
        <dd>{eventConfig.name}</dd>
      </div>
      <div>
        <dt>Event date</dt>
        <dd>{eventConfig.date}</dd>
      </div>
      <div>
        <dt>Event time</dt>
        <dd>{eventConfig.time}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>{eventConfig.location}</dd>
      </div>
    </>
  );
}
