"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppRole } from "../../lib/auth";

function NavGroup({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const menuId = useId();

  return (
    <div
      style={{
        display: "inline-block",
        marginRight: "18px",
        position: "relative",
      }}
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={onToggle}
        style={{
          cursor: "pointer",
          background: "none",
          border: 0,
          padding: 0,
          font: "inherit",
          fontWeight: "bold",
        }}
      >
        {title}
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          style={{
            position: "absolute",
            background: "white",
            border: "1px solid #ccc",
            padding: "10px",
            zIndex: 1000,
            minWidth: "220px",
            lineHeight: "1.8",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function Nav({
  authControls,
  role,
}: {
  authControls: ReactNode;
  role: AppRole | null;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setOpenGroup(null);
  }, [pathname]);

  useEffect(() => {
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") {
          setOpenGroup(null);
        }
        return;
      }

      if (
        navRef.current &&
        event.target instanceof Node &&
        !navRef.current.contains(event.target)
      ) {
        setOpenGroup(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, []);

  const toggleGroup = (title: string) => {
    setOpenGroup((current) => (current === title ? null : title));
  };

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      style={{
        padding: "15px 40px",
        borderBottom: "1px solid #ddd",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Link
        href="/dashboard"
        aria-label="NOBGFC dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          marginRight: "25px",
          color: "inherit",
          textDecoration: "none",
        }}
      >
        <Image
          src="/nobgfc-logo.png"
          alt="NOBGFC club logo"
          width={48}
          height={48}
          priority
        />
        <strong>NOBGFC</strong>
      </Link>

      <Link href="/dashboard" style={{ marginRight: "20px" }}>
        Dashboard
      </Link>

      <NavGroup title="Competition" isOpen={openGroup === "Competition"} onToggle={() => toggleGroup("Competition")}>
        <div><Link href="/standings">Raw Standings</Link></div>
        <div><Link href="/official-standings">Official Boats</Link></div>
        <div><Link href="/official-angler-standings">Official Anglers</Link></div>
        <div><Link href="/official-youth-standings">Youth Standings</Link></div>
        <div><Link href="/tournament-standings">Tournaments</Link></div>
      </NavGroup>

      <NavGroup title="Directory" isOpen={openGroup === "Directory"} onToggle={() => toggleGroup("Directory")}>
        <div><Link href="/boats">Boats</Link></div>
        <div><Link href="/anglers">Anglers</Link></div>
      </NavGroup>

      <NavGroup title="History" isOpen={openGroup === "History"} onToggle={() => toggleGroup("History")}>
        <div><Link href="/hall-of-fame">Hall of Fame</Link></div>
        <div><Link href="/champions">Hall of Champions</Link></div>
        <div><Link href="/historical-standings">Historical Standings</Link></div>
        <div><Link href="/awards">Awards</Link></div>
      </NavGroup>

      <NavGroup title="Records" isOpen={openGroup === "Records"} onToggle={() => toggleGroup("Records")}>
        <div><Link href="/records">Club Records</Link></div>
        <div><Link href="/record-progressions">Record Progressions</Link></div>
        <div><Link href="/stats">Club Statistics</Link></div>
      </NavGroup>

      <NavGroup title="Media" isOpen={openGroup === "Media"} onToggle={() => toggleGroup("Media")}>
        <div><Link href="/gallery">Photo Gallery</Link></div>
      </NavGroup>

      {(role === "weighmaster" || role === "admin") && (
        <NavGroup
          title={role === "admin" ? "Admin" : "Weighmaster"}
          isOpen={openGroup === "Admin"}
          onToggle={() => toggleGroup("Admin")}
        >
          <div><Link href="/admin/catch-entry">Enter Catch</Link></div>
          <div><Link href="/admin/catches">Manage Catches</Link></div>
          {role === "admin" && (
            <>
              <div><Link href="/admin/boats">Manage Boats</Link></div>
              <div><Link href="/admin/anglers">Manage Anglers</Link></div>
              <div><Link href="/admin/events">Manage Events</Link></div>
              <div><Link href="/admin/scoring-audit">Scoring Audit</Link></div>
              <div><Link href="/admin/recalculate-scores">Recalculate Scores</Link></div>
              <div><Link href="/admin/records-review">Records Review</Link></div>
              <div><Link href="/admin/historical-standings">Historical Standings Admin</Link></div>
              <div><Link href="/admin/season-champions">Season Champions</Link></div>
            </>
          )}
        </NavGroup>
      )}

      {authControls}
    </nav>
  );
}
