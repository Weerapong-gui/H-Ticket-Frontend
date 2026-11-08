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
const gallery = [
  { image: "hallway", alt: "ทางเดินมืดในบ้านเก่า มีแสงเทียน" },
  { image: "room", alt: "ห้องเก่าในบ้านร้าง" },
  { image: "ritual", alt: "ห้องที่จุดเทียนไว้รอบโต๊ะ" },
];
export default function Home() {
  return (
    <main>
      <section className="hero">
        <Image
          src="/images/mansion.jpg"
          alt="บ้านเก่าทรุดโทรมใต้พระจันทร์สีแดง"
          fill
          loading="eager"
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="fog" />
        <div className="hero-content">
          <Reveal>
            <h1>
              <span>THE</span>HAUNTED
              <br />
              HOUSE<span className="title-mark">✦</span>
            </h1>
            <p className="hero-subtitle">บ้านผีสิง</p>
            <p className="hero-description">เข้าไปแล้ว อย่าหันหลังกลับ</p>
            <div className="hero-actions">
              <Link href="/booking" className="button">
                จองบัตร <ArrowRight size={18} />
              </Link>
              <Link href="#attraction" className="text-link">
                เกี่ยวกับงาน <ArrowDown size={15} />
              </Link>
            </div>
            <div className="hero-note">
              <span className="live-dot" /> {eventConfig.type} ·{" "}
              {eventConfig.date}
            </div>
          </Reveal>
        </div>
      </section>
      <div className="info-strip">
        <span>
          <MapPin /> สถานที่: {eventConfig.location}
        </span>
        <span>
          <Clock3 /> เวลา: {eventConfig.time}
        </span>
        <span>
          <CalendarDays /> วันที่: {eventConfig.date}
        </span>
        <span>
          <Ticket /> {money(TICKET_PRICE)} ต่อคน
        </span>
      </div>
      <section className="section story" id="attraction">
        <Reveal className="story-image">
          <Image
            src="/images/mansion.jpg"
            alt="บ้านร้างกับหน้าต่างมืด ๆ"
            fill
            sizes="(max-width: 700px) 100vw, 45vw"
          />
        </Reveal>
        <Reveal className="story-copy">
          <p className="eyebrow">เกี่ยวกับงาน</p>
          <h2>
            บ้านหลังนี้
            <br />
            <em>ไม่เคยว่าง</em>
          </h2>
          <p>ไฟดับ ประตูเปิดค้างไว้ และมีบางอย่างรอคุณอยู่ข้างใน</p>
          <p>เดินเข้าไป หาทางออกให้เจอ แล้วอย่าหันกลับไปมอง</p>
        </Reveal>
      </section>
      <section className="section experiences" id="experiences">
        <div className="experience-grid">
          {gallery.map((g) => (
            <Reveal key={g.image}>
              <div className="experience">
                <Image
                  src={`/images/${g.image}.jpg`}
                  alt={g.alt}
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="quote">
        <Flame />
        <p>
          “ผนังบ้านนี้ไม่ได้มีแค่หู
          <br />
          <em>มันจำทุกอย่างได้”</em>
        </p>
      </section>
      <section className="section tickets-section" id="tickets">
        <Reveal className="center-heading">
          <p className="eyebrow">บัตร</p>
          <h2>
            บัตร<em>ล่วงหน้า</em>
          </h2>
        </Reveal>
        <Reveal className="early-bird-home">
          <TicketAccordion />
          <Link href="/booking" className="button">
            จองบัตร <ArrowRight size={16} />
          </Link>
        </Reveal>
        <p className="ticket-note">
          1 รหัสนักศึกษา = 1 ใบ · โอนแล้วแนบสลิป รับเลขบัตรทันที
        </p>
      </section>
      <section className="final-cta">
        <h2>
          กล้า<em>เข้ามาไหม?</em>
        </h2>
        <Link href="/booking" className="button">
          จองบัตร <ArrowRight size={17} />
        </Link>
      </section>
    </main>
  );
}
