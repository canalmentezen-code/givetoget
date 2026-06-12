import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditDisplay } from "@/components/ui/CreditDisplay";
import { syncUser } from "@/lib/auth-sync.server";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { cookies } from "next/headers";
import { getTranslation, Language } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import styles from "./layout.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  await syncUser(session.user);

  const cookieStore = await cookies();
  const lang = (cookieStore.get("lang")?.value || "pt") as Language;
  const t = getTranslation(lang);

  const navItems = [
    { href: "/showcase", label: t("nav.showcase"), icon: "🔭" },
    { href: "/submit", label: t("nav.listProject"), icon: "➕" },
    { href: "/access-requests", label: t("nav.accessRequests"), icon: "🔑" },
    { href: "/leaderboard", label: t("nav.leaderboard"), icon: "🏆" },
    { href: "/profile", label: t("nav.profile"), icon: "👤" },
  ];

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar} aria-label="Dashboard navigation">
        <div className={styles.sidebarTop}>
          <div className={styles.logoRow}>
            <Link href="/" className={styles.logo} id="dashboard-logo">
              <img src="/logo.png" alt="GiveToGet Logo" className={styles.logoImg} />
              <span>GiveToGet</span>
            </Link>
            <NotificationBell userId={session.user.id} />
          </div>

          <nav className={styles.nav}>
            {navItems.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                className={styles.navItem}
                id={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className={styles.navIcon} aria-hidden="true">{icon}</span>
                <span className={styles.navLabel}>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <CreditDisplay userId={session.user.id} />
          <div className={styles.userInfo}>
            {session.user.image && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={session.user.image}
                alt={session.user.name ?? "User"}
                className={styles.avatar}
                width={32}
                height={32}
              />
            )}
            <div className={styles.userMeta}>
              <span className={styles.userName}>{session.user.name}</span>
              <span className={styles.userEmail}>{session.user.email}</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0", width: "100%", borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
            <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
              <LanguageSwitcher />
              <CurrencySwitcher />
            </div>
          </div>

          <Link href="/api/auth/signout" className={styles.signout} id="signout-btn">
            {t("nav.signOut")}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className={styles.content}>
        {/* Top bar (mobile) */}
        <header className={styles.topbar}>
          <Link href="/" className={styles.logo}>
            <img src="/logo.png" alt="GiveToGet Logo" className={styles.logoImg} />
            <span>GiveToGet</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell userId={session.user.id} />
            <CreditDisplay userId={session.user.id} />
          </div>
        </header>

        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}
