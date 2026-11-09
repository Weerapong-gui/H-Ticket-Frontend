import { eventConfig } from "@/lib/event-config";
import { TicketAccordion } from "@/components/ticket-accordion";
import { money } from "@/lib/booking";
import { TicketArt } from "@/components/ticket-art";
import { TicketCounter } from "@/components/ticket-counter";
import { ChantTicker } from "@/components/chant-ticker";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ScareLayer } from "@/components/scare/scare-layer";
import { FlashCamera } from "@/components/scare/flash-camera";
import { HeroBackdrop } from "@/components/scare/hero-backdrop";
import { ENTRY_GATE_SCRIPT } from "@/lib/scare/storage";
export default function Home() {
  return (
    <ScareLayer>
      {/* ต้องรันก่อน paint: ซ่อนหน้าประตูสำหรับคนที่เคยเข้าแล้ว */}
      <script dangerouslySetInnerHTML={{ __html: ENTRY_GATE_SCRIPT }} />
      <main>
        <section className="hero">
          <HeroBackdrop />
          <div className="hero-shade" />
          <div className="fog" />
          <div className="hero-content">
            <Reveal>
              <h1>
                <span>THE</span>HAUNTED
                <br />
                HOUSE
              </h1>
              <p className="hero-subtitle">บ้านผีสิง</p>
              <p className="hero-description">เข้าไปแล้ว อย่าหันหลังกลับ</p>
              <div className="hero-actions">
                <Link href="/booking" className="button">
                  จองบัตร <ArrowRight size={18} />
                </Link>
                <Link href="#attraction" className="text-link">
                  บัตรคงเหลือ <ArrowDown size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
        <p className="info-strip">
          <span>{eventConfig.date}</span>
          <span>{eventConfig.time}</span>
          <span>{eventConfig.location}</span>
          <span>
            จองเว็บ {money(eventConfig.ticket.packages[0].price)} / หน้างาน{" "}
            {money(eventConfig.ticket.doorPrice)}
          </span>
        </p>
        <section className="section counter-section" id="attraction">
          <Reveal>
            <TicketCounter />
          </Reveal>
        </section>
        <section className="section camera-section" id="camera">
          <FlashCamera />
        </section>
        <section className="quote">
          <p>
            ผนังบ้านนี้ไม่ได้มีแค่หู
            <br />
            มันจำทุกอย่างได้
          </p>
        </section>
        <section className="section tickets-section" id="tickets">
          <Reveal className="center-heading">
            <h2>บัตรล่วงหน้า</h2>
            <p className="promo-lead">
              ซื้อหน้างานใบละ {money(eventConfig.ticket.doorPrice)}{" "}
              จองผ่านเว็บถูกกว่า
            </p>
          </Reveal>
          <Reveal className="early-bird-home">
            <TicketArt className="home-ticket-art" />
            <TicketAccordion />
            <Link href="/booking" className="button">
              จองบัตร <ArrowRight size={16} />
            </Link>
          </Reveal>
        </section>
        <ChantTicker />
      </main>
    </ScareLayer>
  );
}
