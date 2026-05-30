"use client";

import { useState, type ReactNode } from "react";

export function CodeEditor({
  tag = "Install",
  copyText,
  children,
}: {
  tag?: string;
  copyText: string;
  children: ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="mr-editor">
      <div className="mr-editor-bar">
        <span className="mr-editor-dot" style={{ background: "#ff5f56" }} />
        <span className="mr-editor-dot" style={{ background: "#ffbd2e" }} />
        <span className="mr-editor-dot" style={{ background: "#27c93f" }} />
        <span className="mr-editor-tag">{tag}</span>
        <button type="button" className="mr-editor-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mr-editor-body">{children}</pre>
    </div>
  );
}
