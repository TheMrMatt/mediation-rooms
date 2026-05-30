"use client";

import { useState, type ReactNode } from "react";

/** Accordion para secciones técnicas / secundarias. */
export function Accordion({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mr-accordion" data-open={open}>
      <button
        type="button"
        className="mr-accordion-head"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          {title}
          {subtitle && <span className="mr-accordion-sub">{subtitle}</span>}
        </span>
        <span className="mr-accordion-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && <div className="mr-accordion-body">{children}</div>}
    </div>
  );
}

/**
 * Lista de reglas numeradas con "ver todo / ver menos".
 * Recibe un array plano (serializable) para poder usarse desde Server Components.
 */
export function RulesList({
  rules,
  visibleCount = 3,
}: {
  rules: string[];
  visibleCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rules : rules.slice(0, visibleCount);
  return (
    <>
      <ol className="mr-rules-list">
        {shown.map((rule, i) => (
          <li key={i} className="mr-rule-item">
            <span className="mr-rule-n">{i + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
      {rules.length > visibleCount && (
        <button
          type="button"
          className="mr-toggle-btn"
          style={{ marginTop: 12 }}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Ver menos" : `Ver todo (${rules.length})`}
        </button>
      )}
    </>
  );
}
