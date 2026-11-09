import { eventConfig } from "@/lib/event-config";
import { DICTS, isLang } from "@/lib/i18n/dict";
import { notFound } from "next/navigation";
import { TicketAccordion } from "@/components/ticket-accordion";
import { money } from "@/lib/booking";
import { TicketArt } from "@/components/ticket-art";
import { TicketCounter } from "@/components/ticket-counter";
import { ChantTicker } from "@/components/chant-ticker";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ScareLayer } from "@/components/scare/scare-layer";
import { GhostCamera } from "@/components/scare/ghost-camera";
import { HeroBackdrop } from "@/components/scare/hero-backdrop";
import { ENTRY_GATE_SCRIPT } from "@/lib/scare/storage";
export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = DICTS[lang];
  const web = money(eventConfig.ticket.packages[0].price);
  const door = money(eventConfig.ticket.doorPrice);
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
              <p className="hero-subtitle">{t.home.subtitle}</p>
              <p className="hero-description">{t.home.tagline}</p>
              <div className="hero-actions">
                <Link href={`/${lang}/booking`} className="button">
                  {t.common.book} <ArrowRight size={18} />
                </Link>
                <Link href="#attraction" className="text-link">
                  {t.common.remaining} <ArrowDown size={15} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
        <p className="info-strip">
          <span>{t.event.date}</span>
          <span>{t.event.time}</span>
          <span>{t.event.location}</span>
          <span>{t.home.priceStrip(web, door)}</span>
        </p>
        <section className="section counter-section" id="attraction">
          <Reveal>
            <TicketCounter />
          </Reveal>
        </section>
        <section className="section camera-section" id="camera">
          <GhostCamera />
        </section>
        <section className="quote">
          <p>
            {t.home.quote1}
            <br />
            {t.home.quote2}
          </p>
        </section>
        <section className="section tickets-section" id="tickets">
          <Reveal className="center-heading">
            <h2>{t.home.ticketsTitle}</h2>
            <p className="promo-lead">{t.home.doorLead(door)}</p>
          </Reveal>
          <Reveal className="early-bird-home">
            <TicketArt className="home-ticket-art" />
            <TicketAccordion />
            <Link href={`/${lang}/booking`} className="button">
              {t.common.book} <ArrowRight size={16} />
            </Link>
          </Reveal>
        </section>
        <ChantTicker />
      </main>
    </ScareLayer>
  );
}
