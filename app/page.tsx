import { eventConfig } from "@/lib/event-config";
import { TicketAccordion } from "@/components/ticket-accordion";
import { TICKET_PRICE, money } from "@/lib/booking";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowDown,
  Clock3,
  MapPin,
  CalendarDays,
  Ticket,
  Flame,
} from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
const experiences = [
  {
    name: "The Cursed Hallway",
    tag: "01 / THE DESCENT",
    text: "Every footstep echoes. Not all of them are yours.",
    image: "hallway",
  },
  {
    name: "The Forbidden Room",
    tag: "02 / THE DISCOVERY",
    text: "Some secrets were locked away for a reason.",
    image: "room",
  },
  {
    name: "The Final Ritual",
    tag: "03 / THE RECKONING",
    text: "The house has been waiting for one last guest.",
    image: "ritual",
  },
];
export default function Home() {
  return (
    <main>
      <section className="hero">
        <Image
          src="/images/mansion.jpg"
          alt="A decaying Victorian mansion beneath a blood-red moon"
          fill
          loading="eager"
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="fog" />
        <div className="hero-content">
          <Reveal>
            <p className="eyebrow">
              <span /> THE DOORS ARE OPEN. WILL YOU ENTER?
            </p>
            <h1>
              <span>THE</span>HAUNTED
              <br />
              HOUSE<span className="title-mark">✦</span>
            </h1>
            <p className="hero-subtitle">AN IMMERSIVE HORROR EXPERIENCE</p>
            <p className="hero-description">
              Step inside a house where the past
              <br className="desktop-break" /> refuses to stay buried.
            </p>
            <div className="hero-actions">
              <Link href="/booking" className="button">
                Book tickets <ArrowRight size={18} />
              </Link>
              <Link href="#attraction" className="text-link">
                Discover the house <ArrowDown size={15} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="live-dot" /> {eventConfig.type} ·{" "}
              {eventConfig.date}
            </div>
          </Reveal>
        </div>
        <div className="hero-bottom">
          <span>THE HOUSE REMEMBERS EVERYTHING.</span>
          <a href="#attraction">
            SCROLL TO UNCOVER <ArrowDown size={14} />
          </a>
          <span>{eventConfig.type.toUpperCase()}</span>
        </div>
      </section>
      <div className="info-strip">
        <span>
          <MapPin /> Location: {eventConfig.location}
        </span>
        <span>
          <Clock3 /> Event time: {eventConfig.time}
        </span>
        <span>
          <CalendarDays /> Event date: {eventConfig.date}
        </span>
        <span>
          <Ticket /> {money(TICKET_PRICE)} per soul
        </span>
      </div>
      <section className="section story" id="attraction">
        <Reveal className="story-image">
          <Image
            src="/images/mansion.jpg"
            alt="The forgotten house and its shadowed windows"
            fill
            sizes="(max-width: 700px) 100vw, 45vw"
          />
          <span className="image-caption">
            EST. 1893 — ABANDONED, NEVER EMPTY.
          </span>
          <div className="image-seal">
            THE PAST
            <br />
            <b>IS ALIVE</b>
          </div>
        </Reveal>
        <Reveal className="story-copy">
          <p className="eyebrow">01 / THE STORY BEHIND THE SILENCE</p>
          <h2>
            A house with
            <br />a <em>dark history.</em>
          </h2>
          <p>
            They say the family left in the winter of 1893.
            <br />
            They say the house has been empty ever since.
          </p>
          <p>
            But every night, the lights return. Footsteps travel through locked
            rooms. And somewhere upstairs, a music box plays a song no one
            remembers.
          </p>
          <p>
            Cross the threshold into a fully immersive world of winding
            corridors, buried secrets, and things that move when you look away.
          </p>
          <Link className="text-link" href="#experiences">
            Some stories must be experienced <ArrowRight size={16} />
          </Link>
        </Reveal>
      </section>
      <section className="section experiences" id="experiences">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">02 / THERE IS NO TURNING BACK</p>
            <h2>
              Three chapters.
              <br />
              <em>One unforgettable nightmare.</em>
            </h2>
          </div>
          <p>
            Follow the story deeper into the house.
            <br />
            Every room has something to hide.
          </p>
        </Reveal>
        <div className="experience-grid">
          {experiences.map((e, i) => (
            <Reveal key={e.name}>
              <Link href="/booking" className={`experience experience-${i}`}>
                <Image
                  src={`/images/${e.image}.jpg`}
                  alt={
                    e.name === "The Cursed Hallway"
                      ? "An eerie candlelit gothic corridor"
                      : e.name === "The Forbidden Room"
                        ? "A mysterious old room in the abandoned mansion"
                        : "A candlelit chamber prepared for a dark ritual"
                  }
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
                <div className="experience-overlay" />
                <span className="experience-number">0{i + 1}</span>
                <div className="experience-copy">
                  <p className="eyebrow">{e.tag}</p>
                  <h3>{e.name}</h3>
                  <p>{e.text}</p>
                  <span className="experience-link">
                    Enter the experience <ArrowUp />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="quote">
        <Flame />
        <p>
          “The walls don’t just have ears.
          <br />
          <em>They have memories.”</em>
        </p>
        <span>— FROM THE HOUSEKEEPER’S JOURNAL, 1893</span>
      </section>
      <section className="section tickets-section" id="tickets">
        <Reveal className="center-heading">
          <p className="eyebrow">03 / YOUR INVITATION TO THE UNKNOWN</p>
          <h2>
            There’s a place <em>for you.</em>
          </h2>
          <p>
            Your Early Bird invitation. The house will take care of the rest.
          </p>
        </Reveal>
        <Reveal className="early-bird-home">
          <TicketAccordion />
          <Link href="/booking" className="button">
            Book now <ArrowRight size={16} />
          </Link>
        </Reveal>
        <p className="ticket-note">
          เดโมเท่านั้น · เลือกได้ 1–10 ใบ · ไม่มีการเรียกเก็บเงิน
        </p>
      </section>
      <section className="section faq-section" id="faq">
        <Reveal>
          <p className="eyebrow">04 / BEFORE YOU CROSS THE THRESHOLD</p>
          <h2>
            A few things
            <br />
            <em>you should know.</em>
          </h2>
          <p>
            The unknown is frightening.
            <br />
            Your visit doesn’t have to be.
          </p>
        </Reveal>
        <Faq />
      </section>
      <section className="final-cta">
        <p className="eyebrow">SOME CURIOSITIES COME AT A PRICE.</p>
        <h2>
          Will you <em>come inside?</em>
        </h2>
        <Link href="/booking" className="button">
          Book your experience <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
function ArrowUp() {
  return <ArrowRight size={17} style={{ transform: "rotate(-45deg)" }} />;
}
