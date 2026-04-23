import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/30">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
              <span className="text-sm font-black text-brand-foreground">S</span>
            </div>
            <span className="font-extrabold">Simba Supermarket</span>
          </div>
          <p className="text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.shop")}</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/products" className="hover:text-primary">{t("footer.shop.cats")}</Link></li>
            <li><Link to="/products" search={{ sort: "popular" } as never} className="hover:text-primary">{t("footer.shop.best")}</Link></li>
            <li><Link to="/" className="hover:text-primary">{t("footer.shop.new")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.company")}</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/about" target="_blank" rel="noopener noreferrer" className="hover:text-primary">{t("footer.company.about")}</Link></li>
            <li><a href="mailto:hello@simba.rw" className="hover:text-primary">{t("footer.company.contact")}</a></li>
            <li><a href="mailto:careers@simba.rw" className="hover:text-primary">{t("footer.company.careers")}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">{t("footer.help")}</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/checkout" className="hover:text-primary">{t("footer.help.delivery")}</Link></li>
            <li><Link to="/cart" className="hover:text-primary">{t("footer.help.returns")}</Link></li>
            <li><Link to="/checkout" className="hover:text-primary">{t("footer.help.payment")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        Copyright {new Date().getFullYear()} Simba Supermarket. {t("footer.rights")}
      </div>
    </footer>
  );
}
