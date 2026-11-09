import { Header, Footer } from "./chrome";
import { SkipLink } from "./i18n-bits";

/** หัวเว็บ + ท้ายเว็บ: อยู่ใต้ LangProvider ของ /[lang] (หรือไม่มี = ไทย ในหน้าแอดมิน) */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <div id="main-content">{children}</div>
      <Footer />
    </>
  );
}
