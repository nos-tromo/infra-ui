// src/cn.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/primitives/Button.tsx
import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { jsx } from "react/jsx-runtime";
var button = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "border border-border bg-muted text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        danger: "bg-danger text-primary-foreground hover:bg-danger/90"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm"
      }
    },
    defaultVariants: { variant: "primary", size: "md" }
  }
);
var Button = forwardRef(
  ({ className, variant, size, ...props }, ref) => /* @__PURE__ */ jsx("button", { ref, className: cn(button({ variant, size }), className), ...props })
);
Button.displayName = "Button";

// src/primitives/CopyButton.tsx
import { forwardRef as forwardRef2, useEffect, useRef, useState } from "react";
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var CopyButton = forwardRef2(
  ({
    text,
    label = "Copy",
    copiedLabel = "Copied",
    resetDelayMs = 1500,
    variant = "ghost",
    size = "sm",
    className,
    ...props
  }, ref) => {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef(null);
    useEffect(
      () => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
      },
      []
    );
    async function copy() {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
        timerRef.current = null;
      }, resetDelayMs);
    }
    const currentLabel = copied ? copiedLabel : label;
    return /* @__PURE__ */ jsx2(
      Button,
      {
        ref,
        type: "button",
        variant,
        size,
        "aria-label": currentLabel,
        title: currentLabel,
        onClick: () => void copy(),
        className: cn("aspect-square px-0", className),
        ...props,
        children: copied ? /* @__PURE__ */ jsx2(CheckGlyph, {}) : /* @__PURE__ */ jsx2(CopyGlyph, {})
      }
    );
  }
);
CopyButton.displayName = "CopyButton";
function CopyGlyph() {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "h-4 w-4",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx2("rect", { x: "8", y: "8", width: "14", height: "14", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsx2("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
      ]
    }
  );
}
function CheckGlyph() {
  return /* @__PURE__ */ jsx2(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "h-4 w-4",
      "aria-hidden": "true",
      children: /* @__PURE__ */ jsx2("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}

// src/primitives/Card.tsx
import { forwardRef as forwardRef3 } from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var Card = forwardRef3(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx3(
    "div",
    {
      ref,
      className: cn("rounded-lg border border-border bg-muted/30 p-4", className),
      ...props
    }
  )
);
Card.displayName = "Card";

// src/primitives/Input.tsx
import { forwardRef as forwardRef4 } from "react";
import { jsx as jsx4 } from "react/jsx-runtime";
var Input = forwardRef4(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
    "input",
    {
      ref,
      className: cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
        className
      ),
      ...props
    }
  )
);
Input.displayName = "Input";

// src/primitives/Select.tsx
import { forwardRef as forwardRef5 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var Select = forwardRef5(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
    "select",
    {
      ref,
      className: cn(
        "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50",
        className
      ),
      ...props
    }
  )
);
Select.displayName = "Select";

// src/primitives/Badge.tsx
import { cva as cva2 } from "class-variance-authority";
import { jsx as jsx6 } from "react/jsx-runtime";
var badge = cva2("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-muted text-muted-foreground",
      accent: "bg-primary/15 text-primary",
      danger: "bg-danger/15 text-danger"
    }
  },
  defaultVariants: { variant: "neutral" }
});
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx6("span", { className: cn(badge({ variant }), className), ...props });
}

// src/primitives/Spinner.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function Spinner({ className, label = "Loading" }) {
  return /* @__PURE__ */ jsx7(
    "span",
    {
      role: "status",
      "aria-label": label,
      className: cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary",
        className
      )
    }
  );
}

// src/primitives/Banner.tsx
import { cva as cva3 } from "class-variance-authority";
import { jsx as jsx8 } from "react/jsx-runtime";
var banner = cva3("rounded-md border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-border bg-muted/40 text-foreground",
      danger: "border-danger/40 bg-danger/10 text-foreground"
    }
  },
  defaultVariants: { variant: "info" }
});
function Banner({ className, variant, ...props }) {
  const role = variant === "danger" ? "alert" : "status";
  return /* @__PURE__ */ jsx8("div", { role, className: cn(banner({ variant }), className), ...props });
}
export {
  Badge,
  Banner,
  Button,
  Card,
  CopyButton,
  Input,
  Select,
  Spinner,
  cn
};
