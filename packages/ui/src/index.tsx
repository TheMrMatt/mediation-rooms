import type { CSSProperties, ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "2rem",
        gap: "1rem",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: "1.75rem" }}>{title}</h1>
        {description && (
          <p style={{ margin: "0.5rem 0 0", color: "#64748b" }}>
            {description}
          </p>
        )}
      </div>
      {actions}
    </header>
  );
}

export interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantColors: Record<
  NonNullable<StatusBadgeProps["variant"]>,
  { bg: string; text: string }
> = {
  default: { bg: "#f1f5f9", text: "#475569" },
  success: { bg: "#dcfce7", text: "#166534" },
  warning: { bg: "#fef3c7", text: "#92400e" },
  danger: { bg: "#fee2e2", text: "#991b1b" },
};

export function StatusBadge({
  status,
  variant = "default",
}: StatusBadgeProps) {
  const colors = variantColors[variant];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.25rem 0.625rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {status}
    </span>
  );
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  accent?: "default" | "primary" | "success" | "warning";
  children?: ReactNode;
}

const accentBar: Record<NonNullable<CardProps["accent"]>, string> = {
  default: "#e2e8f0",
  primary: "#6366f1",
  success: "#22c55e",
  warning: "#f59e0b",
};

export function Card({
  title,
  subtitle,
  actions,
  accent = "default",
  children,
}: CardProps) {
  return (
    <section
      style={{
        border: "1px solid #e2e8f0",
        borderTop: `3px solid ${accentBar[accent]}`,
        borderRadius: "0.75rem",
        padding: "1.25rem 1.5rem",
        background: "#fff",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
      }}
    >
      {(title || actions) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: subtitle ? "0.25rem" : "0.75rem",
          }}
        >
          {title && (
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 650 }}>{title}</h2>
          )}
          {actions}
        </div>
      )}
      {subtitle && (
        <p style={{ margin: "0 0 0.75rem", color: "#64748b", fontSize: "0.875rem" }}>
          {subtitle}
        </p>
      )}
      {children}
    </section>
  );
}

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  fullWidth = false,
}: ButtonProps) {
  const styles: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
    primary: { background: "#4f46e5", color: "#fff", border: "1px solid #4f46e5" },
    secondary: { background: "#fff", color: "#0f172a", border: "1px solid #cbd5e1" },
    ghost: { background: "transparent", color: "#4f46e5", border: "1px solid transparent" },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        padding: "0.55rem 1rem",
        borderRadius: "0.5rem",
        fontSize: "0.9rem",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        width: fullWidth ? "100%" : undefined,
        transition: "opacity 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

export interface PlaceholderCardProps {
  title: string;
  children?: ReactNode;
}

export function PlaceholderCard({ title, children }: PlaceholderCardProps) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        backgroundColor: "#f8fafc",
      }}
    >
      <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>{title}</h2>
      {children ?? (
        <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem" }}>
          Placeholder — implement in next iteration
        </p>
      )}
    </div>
  );
}

export interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "3rem 1rem",
        color: "#94a3b8",
      }}
    >
      {message}
    </div>
  );
}
