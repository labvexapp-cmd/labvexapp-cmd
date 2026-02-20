import Link from "next/link";
import { Logo } from "./Logo";
import { SITE_NAME } from "@/lib/constants";

const footerLinks = {
  site: [
    { label: "Ana Sayfa", href: "/" },
    { label: "Kategoriler", href: "/kategoriler" },
    { label: "Starlar", href: "/starlar" },
    { label: "Shorts", href: "/shorts" },
  ],
  legal: [
    { label: "Kullanım Şartları", href: "/yasal/kullanim-sartlari" },
    { label: "Gizlilik Politikası", href: "/yasal/gizlilik" },
    { label: "DMCA", href: "/yasal/dmca" },
    { label: "2257 Uyumluluk", href: "/yasal/2257" },
  ],
  support: [
    { label: "İletişim", href: "/iletisim" },
    { label: "Şikayet Bildir", href: "/sikayet" },
    { label: "İçerik Kaldırma", href: "/yasal/dmca" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 pb-20 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-3" />
            <p className="text-sm text-muted-foreground">
              En kaliteli HD videolar. Kategoriler, starlar ve daha fazlası.
            </p>
          </div>

          {/* Site links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Site
            </h3>
            <ul className="space-y-2">
              {footerLinks.site.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Yasal
            </h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Destek
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE_NAME}. Tüm hakları saklıdır.
          </p>
          <p>
            Bu sitedeki tüm modeller 18 yaşından büyüktür. 18 U.S.C. 2257 Record-Keeping Requirements Compliance Statement.
          </p>
        </div>
      </div>
    </footer>
  );
}
