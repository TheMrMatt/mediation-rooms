import type { ReactNode } from "react";
import {
  avatarColor,
  avatarInitials,
  roleLabelEs,
  shortAddr,
  statusLabelEs,
  statusTone,
  type Tone,
} from "./lib";

/** Card de sección con título y subtítulo opcionales. */
export function SectionCard({
  title,
  sub,
  right,
  children,
  className = "mr-card",
}: {
  title?: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {(title || right) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            {title && <h2 className="mr-block-title">{title}</h2>}
            {sub && <p className="mr-block-sub">{sub}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = statusTone(status);
  return (
    <span className={`mr-status mr-status--${tone}`}>
      <span className="mr-status-dot" />
      {statusLabelEs(status)}
    </span>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`mr-pill mr-pill--${tone}`}>{children}</span>;
}

export function Avatar({ label, address }: { label?: string; address?: string }) {
  return (
    <span
      className="mr-avatar"
      style={{ background: avatarColor(address ?? label) }}
      aria-hidden
    >
      {avatarInitials(label, address)}
    </span>
  );
}

export function PartyRow({
  role,
  address,
  label,
  youBadge = false,
}: {
  role: string;
  address?: string;
  label?: string;
  youBadge?: boolean;
}) {
  return (
    <div className="mr-party">
      <Avatar label={label} address={address} />
      <div style={{ minWidth: 0 }}>
        <p className="mr-party-role">
          {label ?? roleLabelEs(role)}
          {youBadge && (
            <span style={{ marginLeft: 6, color: "var(--accent)", fontWeight: 600 }}>
              · vos
            </span>
          )}
        </p>
        <p className="mr-party-addr">{shortAddr(address)}</p>
      </div>
    </div>
  );
}
