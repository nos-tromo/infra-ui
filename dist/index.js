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

// src/primitives/HoverIconAction.tsx
import { forwardRef as forwardRef2 } from "react";
import { jsx as jsx2 } from "react/jsx-runtime";
var HoverIconAction = forwardRef2(
  ({ icon, label, className, ...props }, ref) => /* @__PURE__ */ jsx2(
    Button,
    {
      ref,
      type: "button",
      variant: "ghost",
      size: "sm",
      "aria-label": label,
      title: label,
      className: cn(
        "aspect-square px-0 opacity-0 transition-opacity",
        "group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100",
        className
      ),
      ...props,
      children: icon
    }
  )
);
HoverIconAction.displayName = "HoverIconAction";

// src/primitives/CopyButton.tsx
import { forwardRef as forwardRef3, useEffect, useRef, useState } from "react";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var CopyButton = forwardRef3(
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
    return /* @__PURE__ */ jsx3(
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
        children: copied ? /* @__PURE__ */ jsx3(CheckGlyph, {}) : /* @__PURE__ */ jsx3(CopyGlyph, {})
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
        /* @__PURE__ */ jsx3("rect", { x: "8", y: "8", width: "14", height: "14", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsx3("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
      ]
    }
  );
}
function CheckGlyph() {
  return /* @__PURE__ */ jsx3(
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
      children: /* @__PURE__ */ jsx3("path", { d: "M20 6 9 17l-5-5" })
    }
  );
}

// src/primitives/FileList.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function mergeFiles(existing, incoming) {
  const key = (file) => `${file.name}:${file.size ?? ""}`;
  const seen = new Set(existing.map(key));
  const result = [...existing];
  for (const file of incoming) {
    const k = key(file);
    if (seen.has(k)) continue;
    seen.add(k);
    result.push(file);
  }
  return result;
}
var KB = 1024;
var SIZE_UNITS = ["KB", "MB", "GB", "TB"];
function formatBytes(bytes) {
  if (bytes < KB) return `${bytes} B`;
  let value = bytes / KB;
  let unit = 0;
  while (value >= KB && unit < SIZE_UNITS.length - 1) {
    value /= KB;
    unit += 1;
  }
  let rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  if (rounded >= KB && unit < SIZE_UNITS.length - 1) {
    rounded = 1;
    unit += 1;
  }
  return `${rounded} ${SIZE_UNITS[unit]}`;
}
function XGlyph() {
  return /* @__PURE__ */ jsxs2(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "h-4 w-4",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx4("path", { d: "M18 6 6 18" }),
        /* @__PURE__ */ jsx4("path", { d: "m6 6 12 12" })
      ]
    }
  );
}
function FileList({ files, onRemove, onClear, labels, className }) {
  if (files.length === 0) return null;
  const filesLabel = labels?.files ?? ((n) => `${n} file${n === 1 ? "" : "s"}`);
  const clearAllLabel = labels?.clearAll ?? "Clear all";
  const removeLabel = labels?.remove ?? "Remove";
  const totalBytes = files.reduce((sum, file) => sum + (file.size ?? 0), 0);
  return /* @__PURE__ */ jsxs2("div", { className: cn("rounded-lg border border-border bg-muted/30", className), children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-2 border-b border-border px-3 py-2", children: [
      /* @__PURE__ */ jsxs2("span", { className: "text-sm text-muted-foreground", children: [
        filesLabel(files.length),
        totalBytes > 0 && /* @__PURE__ */ jsxs2(Fragment, { children: [
          " \xB7 ",
          formatBytes(totalBytes)
        ] })
      ] }),
      onClear && /* @__PURE__ */ jsx4(Button, { variant: "ghost", size: "sm", onClick: onClear, children: clearAllLabel })
    ] }),
    /* @__PURE__ */ jsx4("ul", { className: "max-h-64 divide-y divide-border overflow-y-auto", children: files.map((file, index) => /* @__PURE__ */ jsxs2(
      "li",
      {
        className: "group flex items-center gap-3 px-3 py-1.5 text-sm",
        children: [
          /* @__PURE__ */ jsx4("span", { className: "w-6 shrink-0 text-right tabular-nums text-muted-foreground", children: index + 1 }),
          /* @__PURE__ */ jsx4("span", { className: "flex-1 truncate text-foreground", title: file.name, children: file.name }),
          file.size !== void 0 && /* @__PURE__ */ jsx4("span", { className: "shrink-0 tabular-nums text-muted-foreground", children: formatBytes(file.size) }),
          onRemove && /* @__PURE__ */ jsx4(
            HoverIconAction,
            {
              icon: /* @__PURE__ */ jsx4(XGlyph, {}),
              label: `${removeLabel} ${file.name}`,
              onClick: () => onRemove(index)
            }
          )
        ]
      },
      `${file.name}:${file.size ?? ""}`
    )) })
  ] });
}
FileList.displayName = "FileList";

// src/primitives/Card.tsx
import { forwardRef as forwardRef4 } from "react";
import { jsx as jsx5 } from "react/jsx-runtime";
var Card = forwardRef4(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
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
import { forwardRef as forwardRef5 } from "react";
import { jsx as jsx6 } from "react/jsx-runtime";
var Input = forwardRef5(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
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
import { forwardRef as forwardRef6 } from "react";
import { jsx as jsx7 } from "react/jsx-runtime";
var Select = forwardRef6(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx7(
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
import { jsx as jsx8 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx8("span", { className: cn(badge({ variant }), className), ...props });
}

// src/primitives/Spinner.tsx
import { jsx as jsx9 } from "react/jsx-runtime";
function Spinner({ className, label = "Loading" }) {
  return /* @__PURE__ */ jsx9(
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
import { jsx as jsx10 } from "react/jsx-runtime";
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
  return /* @__PURE__ */ jsx10("div", { role, className: cn(banner({ variant }), className), ...props });
}

// src/layout/Shell.tsx
import { jsx as jsx11, jsxs as jsxs3 } from "react/jsx-runtime";
function Shell({ title, actions, children, className }) {
  return /* @__PURE__ */ jsxs3("div", { className: cn("min-h-full", className), children: [
    /* @__PURE__ */ jsxs3("header", { className: "sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-background px-6 py-4", children: [
      /* @__PURE__ */ jsx11("h1", { className: "text-lg font-semibold", children: title }),
      actions
    ] }),
    /* @__PURE__ */ jsx11("main", { className: "mx-auto max-w-5xl px-6 py-8", children })
  ] });
}

// src/graph/ForceGraph.tsx
import { useCallback, useEffect as useEffect2, useMemo, useRef as useRef2, useState as useState2 } from "react";

// src/graph/forceSimulation.ts
var DEFAULTS = {
  centerX: 0,
  centerY: 0,
  linkDistance: 70,
  repulsion: 320,
  linkStrength: 0.08,
  centerStrength: 0.04,
  velocityDecay: 0.6,
  collidePadding: 6
};
var ALPHA_DECAY = 0.0228;
var ALPHA_MIN = 1e-3;
var EPS = 1e-6;
function createForceSimulation(nodes, links, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const byId = /* @__PURE__ */ new Map();
  for (const n of nodes) byId.set(n.id, n);
  const edges = links.map((l) => ({ s: byId.get(l.source), t: byId.get(l.target), weight: l.weight })).filter((e) => !!e.s && !!e.t && e.s !== e.t);
  let alpha = 1;
  function applyFixed(n) {
    if (n.fx != null) {
      n.x = n.fx;
      n.vx = 0;
    }
    if (n.fy != null) {
      n.y = n.fy;
      n.vy = 0;
    }
  }
  function tick() {
    alpha += (0 - alpha) * ALPHA_DECAY;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < EPS) {
          dx = (i - j) % 7 + 0.5;
          dy = (i + j) % 5 - 2;
          d2 = dx * dx + dy * dy;
        }
        const force = opts.repulsion * alpha / d2;
        const dist = Math.sqrt(d2);
        const fx = dx / dist * force;
        const fy = dy / dist * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }
    for (const e of edges) {
      let dx = e.t.x - e.s.x;
      let dy = e.t.y - e.s.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < EPS) {
        dx = 1;
        dy = 0;
        dist = 1;
      }
      const desired = opts.linkDistance;
      const k = (dist - desired) / dist * alpha * opts.linkStrength;
      const sx = dx * k;
      const sy = dy * k;
      e.s.vx += sx;
      e.s.vy += sy;
      e.t.vx -= sx;
      e.t.vy -= sy;
    }
    for (const n of nodes) {
      n.vx += (opts.centerX - n.x) * opts.centerStrength * alpha;
      n.vy += (opts.centerY - n.y) * opts.centerStrength * alpha;
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const minDist = a.r + b.r + opts.collidePadding;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 >= minDist * minDist) continue;
        if (d2 < EPS) {
          dx = (i - j) % 3 + 0.5;
          dy = (i + j) % 3 - 1;
          d2 = dx * dx + dy * dy;
        }
        const dist = Math.sqrt(d2);
        const overlap = (minDist - dist) / dist;
        const sx = dx * overlap * 0.5;
        const sy = dy * overlap * 0.5;
        a.vx -= sx;
        a.vy -= sy;
        b.vx += sx;
        b.vy += sy;
      }
    }
    for (const n of nodes) {
      if (n.fx != null || n.fy != null) {
        applyFixed(n);
        continue;
      }
      n.vx *= opts.velocityDecay;
      n.vy *= opts.velocityDecay;
      n.x += n.vx;
      n.y += n.vy;
    }
    return alpha;
  }
  return {
    nodes,
    get alpha() {
      return alpha;
    },
    set alpha(v) {
      alpha = v;
    },
    tick,
    isSettled: () => alpha < ALPHA_MIN,
    reheat: (value = 0.6) => {
      alpha = Math.max(alpha, value);
    },
    setOptions: (partial) => {
      Object.assign(opts, partial);
    },
    fixNode: (id, x, y) => {
      const n = byId.get(id);
      if (!n) return;
      n.fx = x;
      n.fy = y;
      n.x = x;
      n.y = y;
    },
    releaseNode: (id) => {
      const n = byId.get(id);
      if (!n) return;
      n.fx = null;
      n.fy = null;
    },
    nodeById: (id) => byId.get(id)
  };
}
function phyllotaxisSeed(count, centerX, centerY, spacing = 24) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  const out = [];
  for (let i = 0; i < count; i++) {
    const radius = spacing * Math.sqrt(i + 0.5);
    const theta = i * golden;
    out.push({ x: centerX + radius * Math.cos(theta), y: centerY + radius * Math.sin(theta) });
  }
  return out;
}

// src/graph/mergePositions.ts
var BLOOM_RADIUS = 30;
var GOLDEN = Math.PI * (3 - Math.sqrt(5));
function seedPositions(nodes, edges, previous, centerX, centerY) {
  const out = /* @__PURE__ */ new Map();
  const neighborOf = /* @__PURE__ */ new Map();
  for (const e of edges) {
    if (previous.has(e.source) && !previous.has(e.target) && !neighborOf.has(e.target))
      neighborOf.set(e.target, e.source);
    if (previous.has(e.target) && !previous.has(e.source) && !neighborOf.has(e.source))
      neighborOf.set(e.source, e.target);
  }
  const orphans = [];
  let bloomIndex = 0;
  for (const n of nodes) {
    const prev = previous.get(n.id);
    if (prev) {
      out.set(n.id, { x: prev.x, y: prev.y });
      continue;
    }
    const anchorId = neighborOf.get(n.id);
    const anchor = anchorId ? previous.get(anchorId) : void 0;
    if (anchor) {
      const theta = bloomIndex * GOLDEN;
      bloomIndex += 1;
      out.set(n.id, {
        x: anchor.x + BLOOM_RADIUS * Math.cos(theta),
        y: anchor.y + BLOOM_RADIUS * Math.sin(theta)
      });
      continue;
    }
    orphans.push(n.id);
  }
  const base = out.size;
  const spiral = phyllotaxisSeed(base + orphans.length, centerX, centerY, 30);
  orphans.forEach((id, i) => out.set(id, spiral[base + i]));
  return out;
}

// src/graph/ForceGraph.tsx
import { jsx as jsx12, jsxs as jsxs4 } from "react/jsx-runtime";
var WIDTH = 960;
var HEIGHT = 620;
var CENTER_X = WIDTH / 2;
var CENTER_Y = HEIGHT / 2;
var MIN_ZOOM = 0.25;
var MAX_ZOOM = 4;
var DRAG_THRESHOLD = 4;
var MIN_SPREAD = 0.5;
var MAX_SPREAD = 8;
var BASE_LINK_DISTANCE = 70;
var BASE_REPULSION = 320;
var DEFAULT_LABELS = {
  minEdges: "Min edges",
  edgeLength: "Edge length",
  zoom: "Zoom",
  reset: "Reset",
  fit: "Fit",
  expandSelected: "Expand node",
  maximize: "Expand graph",
  minimize: "Collapse graph"
};
function radiusForSize(size) {
  return Math.min(34, 7 + Math.sqrt(Math.max(1, size ?? 1)) * 2.4);
}
function ExpandIcon() {
  return /* @__PURE__ */ jsxs4(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx12("polyline", { points: "15 3 21 3 21 9" }),
        /* @__PURE__ */ jsx12("polyline", { points: "9 21 3 21 3 15" }),
        /* @__PURE__ */ jsx12("path", { d: "M 21 3 L 14 10" }),
        /* @__PURE__ */ jsx12("path", { d: "M 3 21 L 10 14" })
      ]
    }
  );
}
function CollapseIcon() {
  return /* @__PURE__ */ jsxs4(
    "svg",
    {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsx12("polyline", { points: "4 14 10 14 10 20" }),
        /* @__PURE__ */ jsx12("polyline", { points: "20 10 14 10 14 4" }),
        /* @__PURE__ */ jsx12("path", { d: "M 14 10 L 21 3" }),
        /* @__PURE__ */ jsx12("path", { d: "M 3 21 L 10 14" })
      ]
    }
  );
}
function ForceGraph({
  nodes,
  edges,
  nodeStyles,
  edgeStyles,
  selectedId,
  onSelectNode,
  onExpandNode,
  expandingId,
  statusText,
  legend,
  labels,
  heightClassName,
  className
}) {
  const L = { ...DEFAULT_LABELS, ...labels };
  const svgRef = useRef2(null);
  const [minDegree, setMinDegree] = useState2(0);
  const [spread, setSpread] = useState2(1);
  const [isMaximized, setIsMaximized] = useState2(false);
  const degreeById = useMemo(() => {
    const deg = /* @__PURE__ */ new Map();
    for (const e of edges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    }
    return deg;
  }, [edges]);
  const maxDegree = useMemo(() => {
    let m = 0;
    for (const n of nodes) m = Math.max(m, degreeById.get(n.id) ?? 0);
    return m;
  }, [nodes, degreeById]);
  useEffect2(() => {
    setMinDegree((d) => Math.min(d, maxDegree));
  }, [maxDegree]);
  const visibleNodes = useMemo(
    () => minDegree <= 0 ? nodes : nodes.filter((n) => (degreeById.get(n.id) ?? 0) >= minDegree),
    [nodes, degreeById, minDegree]
  );
  const visibleEdges = useMemo(() => {
    if (minDegree <= 0) return edges;
    const ids = new Set(visibleNodes.map((n) => n.id));
    return edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  }, [edges, visibleNodes, minDegree]);
  const positionsRef = useRef2(/* @__PURE__ */ new Map());
  const sim = useMemo(() => {
    const seeds = seedPositions(visibleNodes, visibleEdges, positionsRef.current, CENTER_X, CENTER_Y);
    const simNodes = visibleNodes.map((n) => {
      const p = seeds.get(n.id);
      return { id: n.id, x: p.x, y: p.y, vx: 0, vy: 0, r: radiusForSize(n.size) };
    });
    const simLinks = visibleEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight ?? 1
    }));
    return createForceSimulation(simNodes, simLinks, { centerX: CENTER_X, centerY: CENTER_Y });
  }, [visibleNodes, visibleEdges]);
  const [, setFrame] = useState2(0);
  const [view, setView] = useState2({ x: 0, y: 0, k: 1 });
  const draggingNodeRef = useRef2(null);
  const dragStartRef = useRef2(null);
  const movedRef = useRef2(false);
  const panRef = useRef2(null);
  const rafRef = useRef2(0);
  const runningRef = useRef2(false);
  const runLoop = useCallback(() => {
    if (typeof requestAnimationFrame !== "function" || runningRef.current) return;
    runningRef.current = true;
    const step = () => {
      for (let i = 0; i < 3; i++) sim.tick();
      for (const n of sim.nodes) positionsRef.current.set(n.id, { x: n.x, y: n.y });
      setFrame((f) => (f + 1) % 1e6);
      if (!sim.isSettled() || draggingNodeRef.current) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        runningRef.current = false;
        rafRef.current = 0;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [sim]);
  useEffect2(() => {
    runLoop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      runningRef.current = false;
    };
  }, [runLoop]);
  useEffect2(() => {
    sim.setOptions({
      linkDistance: BASE_LINK_DISTANCE * spread,
      repulsion: BASE_REPULSION * spread
    });
    sim.reheat();
    runLoop();
  }, [sim, spread, runLoop]);
  useEffect2(() => {
    if (!isMaximized) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMaximized(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isMaximized]);
  useEffect2(() => {
    if (nodes.length === 0) setIsMaximized(false);
  }, [nodes.length]);
  const screenToLayout = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const w = rect.width || WIDTH;
      const h = rect.height || HEIGHT;
      const px = (clientX - rect.left) / w * WIDTH;
      const py = (clientY - rect.top) / h * HEIGHT;
      return { x: (px - view.x) / view.k, y: (py - view.y) / view.k };
    },
    [view]
  );
  const setSvgRef = useCallback((svg) => {
    svgRef.current = svg;
    if (!svg) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = svg.getBoundingClientRect();
      const w = rect.width || WIDTH;
      const h = rect.height || HEIGHT;
      const px = (e.clientX - rect.left) / w * WIDTH;
      const py = (e.clientY - rect.top) / h * HEIGHT;
      setView((v) => {
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor));
        const lx = (px - v.x) / v.k;
        const ly = (py - v.y) / v.k;
        return { k, x: px - lx * k, y: py - ly * k };
      });
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svgRef.current = null;
    };
  }, []);
  const zoomBy = useCallback((factor) => {
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor));
      const lx = (CENTER_X - v.x) / v.k;
      const ly = (CENTER_Y - v.y) / v.k;
      return { k, x: CENTER_X - lx * k, y: CENTER_Y - ly * k };
    });
  }, []);
  const fitToView = useCallback(() => {
    const simNodes = sim.nodes;
    if (simNodes.length === 0) return;
    const PAD = 24;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of simNodes) {
      minX = Math.min(minX, n.x - n.r);
      minY = Math.min(minY, n.y - n.r);
      maxX = Math.max(maxX, n.x + n.r);
      maxY = Math.max(maxY, n.y + n.r);
    }
    minX -= PAD;
    minY -= PAD;
    maxX += PAD;
    maxY += PAD;
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(WIDTH / w, HEIGHT / h)));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setView({ k, x: CENTER_X - cx * k, y: CENTER_Y - cy * k });
  }, [sim]);
  const resetControls = useCallback(() => {
    setMinDegree(0);
    setSpread(1);
    setView({ x: 0, y: 0, k: 1 });
  }, []);
  const onBackgroundPointerDown = useCallback(
    (e) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      panRef.current = { startX: e.clientX, startY: e.clientY, view };
    },
    [view]
  );
  const onBackgroundPointerMove = useCallback((e) => {
    const pan = panRef.current;
    if (!pan) return;
    const svg = svgRef.current;
    const rect = svg?.getBoundingClientRect();
    const w = rect?.width || WIDTH;
    const h = rect?.height || HEIGHT;
    const dx = (e.clientX - pan.startX) / w * WIDTH;
    const dy = (e.clientY - pan.startY) / h * HEIGHT;
    setView({ k: pan.view.k, x: pan.view.x + dx, y: pan.view.y + dy });
  }, []);
  const onBackgroundPointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    panRef.current = null;
  }, []);
  const onNodePointerDown = useCallback(
    (e, id) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      draggingNodeRef.current = id;
      movedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      const p = screenToLayout(e.clientX, e.clientY);
      sim.fixNode(id, p.x, p.y);
      sim.reheat(0.3);
      runLoop();
    },
    [runLoop, screenToLayout, sim]
  );
  const onNodePointerMove = useCallback(
    (e, id) => {
      if (draggingNodeRef.current !== id) return;
      const start = dragStartRef.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_THRESHOLD) {
        movedRef.current = true;
      }
      const p = screenToLayout(e.clientX, e.clientY);
      sim.fixNode(id, p.x, p.y);
      sim.reheat(0.3);
      runLoop();
    },
    [runLoop, screenToLayout, sim]
  );
  const onNodePointerUp = useCallback(
    (e, id) => {
      ;
      e.currentTarget.releasePointerCapture?.(e.pointerId);
      if (draggingNodeRef.current === id) {
        draggingNodeRef.current = null;
        sim.releaseNode(id);
      }
    },
    [sim]
  );
  const handleSelect = useCallback(
    (id) => {
      if (movedRef.current) {
        movedRef.current = false;
        return;
      }
      onSelectNode?.(id);
    },
    [onSelectNode]
  );
  const neighborIds = useMemo(() => {
    if (selectedId == null) return null;
    const set = /* @__PURE__ */ new Set();
    for (const e of visibleEdges) {
      if (e.source === selectedId) set.add(e.target);
      else if (e.target === selectedId) set.add(e.source);
    }
    return set;
  }, [visibleEdges, selectedId]);
  const transform = `translate(${view.x} ${view.y}) scale(${view.k})`;
  return /* @__PURE__ */ jsxs4(
    "div",
    {
      "data-maximized": isMaximized,
      className: cn(
        "space-y-2",
        isMaximized && "fixed inset-0 z-50 flex flex-col bg-background p-4",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs4("div", { className: "space-y-2", children: [
          statusText && /* @__PURE__ */ jsx12("p", { className: "text-sm text-muted-foreground", children: statusText }),
          /* @__PURE__ */ jsxs4("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-2", children: [
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1", role: "group", "aria-label": "Minimum edges per node", children: [
              /* @__PURE__ */ jsx12("span", { className: "text-xs text-muted-foreground", children: L.minEdges }),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": "Decrease minimum edges",
                  disabled: minDegree <= 0,
                  onClick: () => setMinDegree((d) => Math.max(0, d - 1)),
                  className: "h-7 w-7 rounded-md border border-border text-sm leading-none disabled:opacity-40",
                  children: "\u2212"
                }
              ),
              /* @__PURE__ */ jsx12("span", { "aria-live": "polite", className: "w-5 text-center text-xs tabular-nums", children: minDegree }),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": "Increase minimum edges",
                  disabled: minDegree >= maxDegree,
                  onClick: () => setMinDegree((d) => Math.min(maxDegree, d + 1)),
                  className: "h-7 w-7 rounded-md border border-border text-sm leading-none disabled:opacity-40",
                  children: "+"
                }
              )
            ] }),
            /* @__PURE__ */ jsx12("span", { "aria-hidden": "true", className: "h-5 border-l border-border" }),
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx12("span", { className: "text-xs text-muted-foreground", children: L.edgeLength }),
              /* @__PURE__ */ jsx12(
                "input",
                {
                  type: "range",
                  min: MIN_SPREAD,
                  max: MAX_SPREAD,
                  step: 0.1,
                  value: spread,
                  onChange: (e) => setSpread(Number(e.target.value)),
                  "aria-label": L.edgeLength,
                  title: "Spread nodes apart to de-clutter a dense graph",
                  className: "w-28 cursor-pointer accent-primary"
                }
              )
            ] }),
            /* @__PURE__ */ jsx12("span", { "aria-hidden": "true", className: "h-5 border-l border-border" }),
            /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-1", role: "group", "aria-label": "Zoom", children: [
              /* @__PURE__ */ jsx12("span", { className: "text-xs text-muted-foreground", children: L.zoom }),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom in",
                  onClick: () => zoomBy(1.25),
                  className: "h-7 w-7 rounded-md border border-border text-sm leading-none",
                  children: "+"
                }
              ),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": "Zoom out",
                  onClick: () => zoomBy(1 / 1.25),
                  className: "h-7 w-7 rounded-md border border-border text-sm leading-none",
                  children: "\u2212"
                }
              ),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": L.fit,
                  onClick: fitToView,
                  title: "Fit graph to view",
                  className: "h-7 px-2 rounded-md border border-border text-xs",
                  children: L.fit
                }
              )
            ] }),
            /* @__PURE__ */ jsx12("span", { "aria-hidden": "true", className: "h-5 border-l border-border" }),
            /* @__PURE__ */ jsx12(
              "button",
              {
                type: "button",
                onClick: resetControls,
                title: "Reset min edges, edge length, and zoom",
                className: "h-7 px-2 rounded-md border border-border text-xs",
                children: L.reset
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs4(
          "div",
          {
            className: cn(
              "relative rounded-md border border-border bg-background overflow-hidden",
              isMaximized && "flex-1 min-h-0"
            ),
            children: [
              /* @__PURE__ */ jsxs4(
                "svg",
                {
                  ref: setSvgRef,
                  viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
                  className: cn(
                    "w-full touch-none select-none",
                    isMaximized ? "h-full" : heightClassName ?? "h-[60vh]"
                  ),
                  role: "application",
                  "aria-label": "Force-directed graph",
                  children: [
                    /* @__PURE__ */ jsx12(
                      "rect",
                      {
                        x: 0,
                        y: 0,
                        width: WIDTH,
                        height: HEIGHT,
                        fill: "transparent",
                        onPointerDown: onBackgroundPointerDown,
                        onPointerMove: onBackgroundPointerMove,
                        onPointerUp: onBackgroundPointerUp
                      }
                    ),
                    /* @__PURE__ */ jsxs4("g", { transform, children: [
                      /* @__PURE__ */ jsx12("defs", { children: /* @__PURE__ */ jsx12(
                        "marker",
                        {
                          id: "fg-arrow",
                          viewBox: "0 0 10 10",
                          refX: "9",
                          refY: "5",
                          markerWidth: "7",
                          markerHeight: "7",
                          orient: "auto-start-reverse",
                          className: "fill-muted-foreground",
                          children: /* @__PURE__ */ jsx12("path", { d: "M 0 0 L 10 5 L 0 10 z" })
                        }
                      ) }),
                      visibleEdges.map((e, i) => {
                        const a = sim.nodeById(e.source);
                        const b = sim.nodeById(e.target);
                        if (!a || !b) return null;
                        const style = edgeStyles?.[e.kind];
                        const incident = selectedId != null && (e.source === selectedId || e.target === selectedId);
                        const dimmed = selectedId != null && !incident;
                        const dx = b.x - a.x;
                        const dy = b.y - a.y;
                        const dist = Math.hypot(dx, dy) || 1;
                        const tx = e.directed ? b.x - dx / dist * (b.r + 2) : b.x;
                        const ty = e.directed ? b.y - dy / dist * (b.r + 2) : b.y;
                        return /* @__PURE__ */ jsx12(
                          "line",
                          {
                            x1: a.x,
                            y1: a.y,
                            x2: tx,
                            y2: ty,
                            className: "stroke-muted-foreground",
                            strokeOpacity: dimmed ? 0.15 : style?.opacity ?? 0.6,
                            strokeWidth: Math.min(4, 0.6 + Math.log2((e.weight ?? 1) + 1)) / view.k,
                            strokeDasharray: style?.dashed ? `${4 / view.k} ${3 / view.k}` : void 0,
                            markerEnd: e.directed ? "url(#fg-arrow)" : void 0
                          },
                          `${e.source}->${e.target}:${e.kind}:${i}`
                        );
                      }),
                      visibleNodes.map((n) => {
                        const sn = sim.nodeById(n.id);
                        if (!sn) return null;
                        const isSelected = n.id === selectedId;
                        const isNeighbor = neighborIds?.has(n.id) ?? false;
                        const dimmed = selectedId != null && !isSelected && !isNeighbor;
                        const r = sn.r;
                        return /* @__PURE__ */ jsxs4(
                          "g",
                          {
                            transform: `translate(${sn.x} ${sn.y})`,
                            role: "button",
                            tabIndex: 0,
                            "aria-label": `${n.label} (${n.kind})`,
                            "aria-pressed": isSelected,
                            className: "cursor-pointer outline-none",
                            opacity: dimmed ? 0.35 : 1,
                            onPointerDown: (e) => onNodePointerDown(e, n.id),
                            onPointerMove: (e) => onNodePointerMove(e, n.id),
                            onPointerUp: (e) => onNodePointerUp(e, n.id),
                            onClick: () => handleSelect(n.id),
                            onDoubleClick: () => {
                              if (onExpandNode) onExpandNode(n.id);
                            },
                            onKeyDown: (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelectNode?.(n.id);
                              }
                            },
                            children: [
                              /* @__PURE__ */ jsx12("title", { children: `${n.label} (${n.kind})` }),
                              /* @__PURE__ */ jsx12(
                                "circle",
                                {
                                  r,
                                  fill: nodeStyles[n.kind]?.color ?? "currentColor",
                                  fillOpacity: isSelected ? 1 : 0.85,
                                  className: isSelected ? "stroke-foreground" : "stroke-border",
                                  strokeWidth: (isSelected ? 3 : 1.5) / view.k
                                }
                              ),
                              /* @__PURE__ */ jsx12(
                                "text",
                                {
                                  y: r + 11 / view.k,
                                  textAnchor: "middle",
                                  fontSize: 11 / view.k,
                                  className: "pointer-events-none stroke-background",
                                  strokeWidth: 3 / view.k,
                                  strokeLinejoin: "round",
                                  style: { paintOrder: "stroke" },
                                  fill: nodeStyles[n.kind]?.color ?? "currentColor",
                                  children: n.label.length > 24 ? `${n.label.slice(0, 23)}\u2026` : n.label
                                }
                              )
                            ]
                          },
                          n.id
                        );
                      })
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  "aria-label": isMaximized ? L.minimize : L.maximize,
                  "aria-pressed": isMaximized,
                  title: isMaximized ? L.minimize : L.maximize,
                  onClick: () => setIsMaximized((m) => !m),
                  className: "absolute left-2 top-2 z-10 rounded-md border border-border bg-background/90 p-1.5 text-muted-foreground hover:text-foreground",
                  children: isMaximized ? /* @__PURE__ */ jsx12(CollapseIcon, {}) : /* @__PURE__ */ jsx12(ExpandIcon, {})
                }
              ),
              selectedId && onExpandNode && /* @__PURE__ */ jsx12(
                "button",
                {
                  type: "button",
                  disabled: expandingId === selectedId,
                  onClick: () => onExpandNode(selectedId),
                  className: "absolute bottom-2 left-2 z-10 rounded-md border border-border bg-background/90 px-2 py-1 text-xs text-foreground disabled:opacity-40",
                  children: L.expandSelected
                }
              ),
              legend && legend.length > 0 && /* @__PURE__ */ jsx12("div", { className: "absolute right-2 top-2 max-w-[12rem] rounded-md border border-border bg-background/90 p-2 text-xs space-y-1", children: /* @__PURE__ */ jsx12("ul", { className: "space-y-0.5", children: legend.map(({ kind, label }) => /* @__PURE__ */ jsxs4("li", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx12(
                  "span",
                  {
                    "aria-hidden": "true",
                    className: "inline-block h-2.5 w-2.5 rounded-full shrink-0",
                    style: { backgroundColor: nodeStyles[kind]?.color ?? "currentColor" }
                  }
                ),
                /* @__PURE__ */ jsx12("span", { className: "truncate", children: label })
              ] }, kind)) }) })
            ]
          }
        )
      ]
    }
  );
}
export {
  Badge,
  Banner,
  Button,
  Card,
  CopyButton,
  FileList,
  ForceGraph,
  HoverIconAction,
  Input,
  Select,
  Shell,
  Spinner,
  cn,
  mergeFiles
};
