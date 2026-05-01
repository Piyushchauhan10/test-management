"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

type Orientation = "horizontal" | "vertical";

type PanelConfig = {
  defaultSize?: number;
  minSize: number;
};

type PanelGroupContextValue = {
  orientation: Orientation;
  sizes: number[];
  getPanelStyle: (index: number) => React.CSSProperties;
  startResize: (panelIndex: number, event: React.PointerEvent<HTMLDivElement>) => void;
};

const PanelGroupContext = React.createContext<PanelGroupContextValue | null>(null);

function toPercent(value?: number | string) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace("%", ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeSizes(count: number, sizes: number[], panelConfigs: PanelConfig[]) {
  const base =
    sizes.length === count
      ? [...sizes]
      : panelConfigs.map((config) => config.defaultSize ?? 100 / Math.max(count, 1));

  const mins = panelConfigs.map((config) => config.minSize);
  const total = base.reduce((sum, value) => sum + value, 0) || 100;
  let normalized = base.map((value) => (value / total) * 100);

  normalized = normalized.map((value, index) => Math.max(value, mins[index] ?? 0));

  const adjustedTotal = normalized.reduce((sum, value) => sum + value, 0);
  if (adjustedTotal !== 100 && count > 0) {
    let flexibleIndex = -1;
    for (let index = normalized.length - 1; index >= 0; index -= 1) {
      if (normalized[index] > (mins[index] ?? 0)) {
        flexibleIndex = index;
        break;
      }
    }

    const targetIndex = flexibleIndex >= 0 ? flexibleIndex : count - 1;
    normalized[targetIndex] += 100 - adjustedTotal;
  }

  return normalized;
}

function sizesAreEqual(first: number[], second: number[], tolerance = 0.05) {
  if (first.length !== second.length) return false;

  return first.every((value, index) => Math.abs(value - (second[index] ?? 0)) <= tolerance);
}

type ResizablePanelGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation: Orientation;
  autoSaveId?: string;
  layout?: number[];
  onLayout?: (sizes: number[]) => void;
};

type ResizablePanelInternalProps = {
  __panelIndex?: number;
};

type ResizableHandleInternalProps = {
  __handleIndex?: number;
};

type ResizablePanelProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultSize?: number | string;
  minSize?: number | string;
} & ResizablePanelInternalProps;

type ResizableHandleProps = React.HTMLAttributes<HTMLDivElement> & {
  withHandle?: boolean;
} & ResizableHandleInternalProps;

function isResizablePanelElement(
  child: React.ReactNode,
): child is React.ReactElement<ResizablePanelProps> {
  return React.isValidElement(child) && child.type === ResizablePanel;
}

function isResizableHandleElement(
  child: React.ReactNode,
): child is React.ReactElement<ResizableHandleProps> {
  return React.isValidElement(child) && child.type === ResizableHandle;
}

export function ResizablePanelGroup({
  orientation,
  className,
  children,
  autoSaveId,
  layout,
  onLayout,
  ...props
}: ResizablePanelGroupProps) {
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const lastEmittedLayoutRef = React.useRef<number[]>([]);
  const childArray = React.Children.toArray(children);

  const panelConfigs = React.useMemo(
    () =>
      childArray
        .filter(isResizablePanelElement)
        .map((child) => ({
          defaultSize: toPercent(child.props.defaultSize),
          minSize: toPercent(child.props.minSize) ?? 10,
        })),
    [childArray],
  );

  const getNormalizedLayout = React.useCallback(
    (candidate?: number[]) => normalizeSizes(panelConfigs.length, candidate ?? [], panelConfigs),
    [panelConfigs],
  );

  const [sizes, setSizes] = React.useState<number[]>(() => {
    if (!panelConfigs.length) return [];

    if (layout?.length) {
      return getNormalizedLayout(layout);
    }

    if (autoSaveId && typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(autoSaveId);
        if (saved) {
          const parsed = JSON.parse(saved) as number[];
          if (Array.isArray(parsed) && parsed.every((value) => Number.isFinite(value))) {
            return getNormalizedLayout(parsed);
          }
        }
      } catch {
        return getNormalizedLayout();
      }
    }

    return getNormalizedLayout();
  });

  React.useEffect(() => {
    if (!panelConfigs.length || !layout?.length) return;

    const nextSizes = getNormalizedLayout(layout);
    setSizes((current) => (sizesAreEqual(current, nextSizes) ? current : nextSizes));
  }, [getNormalizedLayout, layout, panelConfigs.length]);

  React.useEffect(() => {
    if (!panelConfigs.length || layout?.length) return;

    setSizes((current) => {
      const nextSizes = getNormalizedLayout(current);
      return sizesAreEqual(current, nextSizes) ? current : nextSizes;
    });
  }, [getNormalizedLayout, layout, panelConfigs.length]);

  React.useEffect(() => {
    if (!autoSaveId || typeof window === "undefined" || !panelConfigs.length || layout?.length) return;

    try {
      const saved = window.localStorage.getItem(autoSaveId);
      if (!saved) return;

      const parsed = JSON.parse(saved) as number[];
      if (!Array.isArray(parsed) || !parsed.every((value) => Number.isFinite(value))) return;

      const nextSizes = getNormalizedLayout(parsed);
      setSizes((current) => (sizesAreEqual(current, nextSizes) ? current : nextSizes));
    } catch {
      return;
    }
  }, [autoSaveId, getNormalizedLayout, layout, panelConfigs.length]);

  React.useEffect(() => {
    if (!sizes.length) return;

    if (!sizesAreEqual(lastEmittedLayoutRef.current, sizes)) {
      lastEmittedLayoutRef.current = sizes;
      onLayout?.(sizes);
    }

    if (autoSaveId && typeof window !== "undefined") {
      window.localStorage.setItem(autoSaveId, JSON.stringify(sizes));
    }
  }, [autoSaveId, onLayout, sizes]);

  const getPanelStyle = React.useCallback(
    (index: number) => {
      const size = sizes[index] ?? panelConfigs[index]?.defaultSize ?? 100;
      return orientation === "horizontal"
        ? { width: `${size}%` }
        : { height: `${size}%` };
    },
    [orientation, panelConfigs, sizes],
  );

  const startResize = React.useCallback(
    (panelIndex: number, event: React.PointerEvent<HTMLDivElement>) => {
      const group = groupRef.current;
      if (!group || !panelConfigs[panelIndex] || !panelConfigs[panelIndex + 1]) return;

      const rect = group.getBoundingClientRect();
      const startPosition = orientation === "horizontal" ? event.clientX : event.clientY;
      const startSizes = sizes.length ? [...sizes] : getNormalizedLayout();

      const move = (moveEvent: PointerEvent) => {
        const currentPosition =
          orientation === "horizontal" ? moveEvent.clientX : moveEvent.clientY;
        const delta = currentPosition - startPosition;
        const total = orientation === "horizontal" ? rect.width : rect.height;
        const deltaPercent = total > 0 ? (delta / total) * 100 : 0;

        const firstMin = panelConfigs[panelIndex]?.minSize ?? 10;
        const secondMin = panelConfigs[panelIndex + 1]?.minSize ?? 10;
        const pairTotal = (startSizes[panelIndex] ?? 0) + (startSizes[panelIndex + 1] ?? 0);
        let nextFirst = Math.min(
          pairTotal - secondMin,
          Math.max(firstMin, (startSizes[panelIndex] ?? 0) + deltaPercent),
        );
        let nextSecond = pairTotal - nextFirst;

        if (firstMin === 0 && nextFirst <= 0.5) {
          nextFirst = 0;
          nextSecond = pairTotal;
        } else if (secondMin === 0 && nextSecond <= 0.5) {
          nextFirst = pairTotal;
          nextSecond = 0;
        }

        setSizes((current) => {
          const next = current.length ? [...current] : [...startSizes];
          next[panelIndex] = nextFirst;
          next[panelIndex + 1] = nextSecond;
          return sizesAreEqual(current, next) ? current : next;
        });
      };

      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
    },
    [getNormalizedLayout, orientation, panelConfigs, sizes],
  );

  const value = React.useMemo<PanelGroupContextValue>(
    () => ({
      orientation,
      sizes,
      getPanelStyle,
      startResize,
    }),
    [getPanelStyle, orientation, sizes, startResize],
  );

  const indexedChildren = React.useMemo(
    () =>
      childArray.map((child, index) => {
        const panelIndex = childArray
          .slice(0, index)
          .filter(isResizablePanelElement).length;
        const handleIndex = childArray
          .slice(0, index)
          .filter(isResizableHandleElement).length;

        if (isResizablePanelElement(child)) {
          return React.cloneElement(child, {
            __panelIndex: panelIndex,
            key: child.key ?? index,
          });
        }

        if (isResizableHandleElement(child)) {
          return React.cloneElement(child, {
            __handleIndex: handleIndex,
            key: child.key ?? index,
          });
        }

        return <React.Fragment key={index}>{child}</React.Fragment>;
      }),
    [childArray],
  );

  return (
    <PanelGroupContext.Provider value={value}>
      <div
        ref={groupRef}
        data-orientation={orientation}
        className={cn(
          "flex h-full w-full overflow-hidden data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col",
          className,
        )}
        {...props}
      >
        {indexedChildren}
      </div>
    </PanelGroupContext.Provider>
  );
}

export function ResizablePanel({
  className,
  children,
  __panelIndex = 0,
  ...props
}: ResizablePanelProps) {
  const context = React.useContext(PanelGroupContext);

  if (!context) {
    throw new Error("ResizablePanel must be used within a ResizablePanelGroup");
  }

  return (
    <div
      data-panel-index={__panelIndex}
      className={cn("min-h-0 min-w-0 shrink-0 grow-0 basis-auto overflow-hidden", className)}
      style={context.getPanelStyle(__panelIndex)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ResizableHandle({
  className,
  withHandle,
  __handleIndex = 0,
  ...props
}: ResizableHandleProps) {
  const context = React.useContext(PanelGroupContext);

  if (!context) {
    throw new Error("ResizableHandle must be used within a ResizablePanelGroup");
  }

  const isHorizontal = context.orientation === "horizontal";

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-orientation={isHorizontal ? "vertical" : "horizontal"}
      onPointerDown={(event) => context.startResize(__handleIndex, event)}
      className={cn(
        "group relative shrink-0 bg-slate-100/70 transition hover:bg-slate-200/80",
        isHorizontal ? "w-2 cursor-col-resize" : "h-2 cursor-row-resize",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute bg-slate-200 group-hover:bg-slate-300",
          isHorizontal
            ? "inset-y-0 left-1/2 w-px -translate-x-1/2"
            : "inset-x-0 top-1/2 h-px -translate-y-1/2",
        )}
      />
      {withHandle ? (
        <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-1 text-slate-400 shadow-sm">
          <GripVertical className={cn("size-3.5", !isHorizontal && "rotate-90")} />
        </div>
      ) : null}
    </div>
  );
}
