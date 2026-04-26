import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, ACCENTS } from "@/lib/theme";
import { useI18n, LANGS, type Lang } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { PICKUP_BRANCHES, type BranchName } from "@/lib/demo-store";
import { getBranchMapUrl } from "@/lib/branchLocations";
import {
  Languages,
  MapPin,
  Moon,
  Palette,
  Search,
  ShoppingBag,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import logoImage from "@/assets/logo1.png";

export function Header() {
  const { theme, toggle, accent, setAccent } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { count, subtotal, selectedBranch, setSelectedBranch } = useCart();
  const { user, signOut } = useAuth();
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const selectedBranchMapUrl = getBranchMapUrl(selectedBranch);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      navigate({ to: "/products", search: { q: q.trim() } as never });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/40 bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 md:gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-transparent p-1.5 shadow-md shadow-black/15">
            <img src={logoImage} alt="Simba" className="h-full w-full object-contain" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="text-base font-black tracking-tight text-primary-foreground">Simba</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/85">
              Supermarket
            </div>
          </div>
        </Link>

        <form onSubmit={submit} className="min-w-0 flex-1">
          <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-background/95 px-3 py-2 shadow-sm">
            <Search className="h-4 w-4 text-primary" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search.placeholder")}
              className="h-8 border-0 bg-transparent px-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>
        </form>

        <label className="hidden items-center gap-2 lg:flex">
          <a
            href={selectedBranchMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${selectedBranch} branch in Google Maps`}
            title={`Open ${selectedBranch} branch in Google Maps`}
            className="rounded-full p-1 text-primary-foreground transition hover:bg-white/15 hover:text-primary-foreground"
          >
            <MapPin className="h-4 w-4" />
          </a>
          <select
            aria-label={t("header.chooseBranch")}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as BranchName)}
            className="h-10 rounded-xl border border-white/25 bg-background/95 px-3 text-sm font-semibold text-foreground"
          >
            {PICKUP_BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>

        <a
          href={selectedBranchMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-full bg-white/14 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-white hover:text-primary xl:inline-flex"
        >
          {t("ui.fastDeliveryBanner")}
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggle}
            aria-label="Toggle theme"
            className="rounded-full text-primary-foreground hover:bg-white/12 hover:text-primary-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full text-primary-foreground hover:bg-white/12 hover:text-primary-foreground" aria-label={t("ui.colorTheme")}>
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("ui.colorTheme")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ACCENTS.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={accent === a.id ? "font-semibold" : ""}
                >
                  <span
                    className="mr-2 inline-block h-3.5 w-3.5 rounded-full ring-1 ring-border"
                    style={{ background: a.swatch }}
                  />
                  {a.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-full text-primary-foreground hover:bg-white/12 hover:text-primary-foreground" aria-label="Language">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("lang.label")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGS.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={lang === l.code ? "font-semibold text-primary" : ""}
                >
                  <span className="mr-2">{l.flag}</span>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full gap-2 px-2 text-primary-foreground hover:bg-white/12 hover:text-primary-foreground">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-primary-foreground">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden text-sm font-semibold sm:inline">
                  {user.name.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={user.role === "manager" || user.role === "staff" ? "/admin-dashboard" : "/client-dashboard"}>
                  {user.role === "manager" || user.role === "staff" ? t("admin.dashboard") : t("client.dashboard")}
                </Link>
              </DropdownMenuItem>
              {(user.role === "manager" || user.role === "staff") && (
                <DropdownMenuItem asChild>
                  <Link to="/admin-dashboard">{t("app.dashboard")}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                {t("nav.signout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild variant="ghost" className="rounded-full gap-2 text-primary-foreground hover:bg-white/12 hover:text-primary-foreground">
            <Link to="/signin">
              <UserIcon className="h-4 w-4 text-primary-foreground" />
              <span className="hidden font-semibold sm:inline">{t("nav.signin")}</span>
            </Link>
          </Button>
        )}

        <Button
          asChild
          className="relative h-11 rounded-2xl bg-white/16 px-4 text-primary-foreground shadow-lg shadow-black/15 hover:bg-white/22"
        >
          <Link to="/cart" className="gap-2">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-yellow px-1 text-[10px] font-bold text-black ring-2 ring-primary">
                  {count}
                </span>
              )}
            </div>
            <span className="hidden font-bold tabular-nums sm:inline">
              {subtotal > 0
                ? new Intl.NumberFormat("en-RW", {
                    style: "currency",
                    currency: "RWF",
                    maximumFractionDigits: 0,
                  }).format(subtotal)
                : t("nav.cart")}
            </span>
          </Link>
        </Button>
      </div>

      <div className="border-t border-white/20 bg-primary px-4 py-2 lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <a
            href={selectedBranchMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${selectedBranch} branch in Google Maps`}
            title={`Open ${selectedBranch} branch in Google Maps`}
            className="rounded-full p-1 text-primary-foreground transition hover:bg-white/15 hover:text-primary-foreground"
          >
            <MapPin className="h-4 w-4" />
          </a>
          <select
            aria-label={t("header.chooseBranch")}
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value as BranchName)}
            className="h-9 flex-1 rounded-xl border border-white/25 bg-background/95 px-3 text-sm font-semibold text-foreground"
          >
            {PICKUP_BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
          {(user?.role === "manager" || user?.role === "staff") && (
            <Button asChild variant="outline" size="sm" className="rounded-xl border-white/25 bg-background/95 text-primary hover:bg-background">
              <Link to="/admin-dashboard">{t("app.dashboard")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
