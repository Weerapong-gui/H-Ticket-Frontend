"use client";
import { useT } from "@/lib/i18n/client";

/** Shared static facts: visitors cannot select or change the event schedule. */
export function EventFacts() {
  const { event } = useT();
  return (
    <>
      <div>
        <dt>{event.labels.name}</dt>
        <dd>{event.name}</dd>
      </div>
      <div>
        <dt>{event.labels.date}</dt>
        <dd>{event.date}</dd>
      </div>
      <div>
        <dt>{event.labels.time}</dt>
        <dd>{event.time}</dd>
      </div>
      <div>
        <dt>{event.labels.location}</dt>
        <dd>{event.location}</dd>
      </div>
    </>
  );
}
