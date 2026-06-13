import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CreditDisplay } from "@/components/ui/CreditDisplay";
import { syncUser } from "@/lib/auth-sync.server";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { cookies } from "next/headers";
import { getTranslation, Language } from "@/lib/translations";
import styles from "./layout.module.css";

// SVG icon components — clean, minimal, professional
function IconCompass() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconKey() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
function IconTrophy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

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
    { href: "/showcase",       label: t("nav.showcase"),       icon: <IconCompass /> },
    { href: "/submit",         label: t("nav.listProject"),    icon: <IconPlus /> },
    { href: "/access-requests",label: t("nav.accessRequests"), icon: <IconKey /> },
    { href: "/leaderboard",    label: t("nav.leaderboard"),    icon: <IconTrophy /> },
    { href: "/profile",        label: t("nav.profile"),        icon: <IconUser /> },
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

          <Link href="/api/auth/signout" className={styles.signout} id="signout-btn">
            <IconLogOut />
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
