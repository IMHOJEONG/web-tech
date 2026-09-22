"use client";

import * as React from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { mergeUiClassName } from "../../lib/merge-ui-class-name";

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

const TooltipDescriptionContext = React.createContext<{
  id: string;
  open: boolean;
} | null>(null);

function useTooltipDescription() {
  const context = React.useContext(TooltipDescriptionContext);
  if (!context) throw new Error("Tooltip parts must be used within Tooltip.");
  return context;
}

// Our single-trigger wrapper owns the accessible description relationship.
function Tooltip({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled,
  ...props
}: Omit<
  TooltipPrimitive.Root.Props,
  "handle" | "triggerId" | "defaultTriggerId"
>) {
  const id = React.useId();
  const [uncontrolledOpen, setOpen] = React.useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  return (
    <TooltipDescriptionContext.Provider value={{ id, open: open && !disabled }}>
      <TooltipPrimitive.Root
        {...props}
        disabled={disabled}
        open={open}
        onOpenChange={(nextOpen, details) => {
          onOpenChange?.(nextOpen, details);
          if (!details.isCanceled) setOpen(nextOpen);
        }}
      />
    </TooltipDescriptionContext.Provider>
  );
}

function TooltipTrigger({
  "aria-describedby": describedBy,
  ...props
}: Omit<TooltipPrimitive.Trigger.Props, "handle">) {
  const context = useTooltipDescription();
  return (
    <TooltipPrimitive.Trigger
      {...props}
      data-slot="tooltip-trigger"
      aria-describedby={
        [describedBy, context.open ? context.id : undefined]
          .filter(Boolean)
          .join(" ") || undefined
      }
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  side = "top",
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: Omit<React.ComponentProps<typeof TooltipPrimitive.Popup>, "id" | "role"> &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "side" | "sideOffset" | "align" | "alignOffset"
  >) {
  const { id } = useTooltipDescription();
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={mergeUiClassName(
            "bg-foreground text-background w-fit origin-(--transform-origin) rounded-md px-3 py-1.5 text-xs text-balance transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0 data-starting-style:scale-95 data-ending-style:scale-95 motion-reduce:transition-none",
            className,
          )}
          {...props}
          id={id}
          role="tooltip"
        >
          {children}
          <TooltipPrimitive.Arrow className="bg-foreground size-2.5 rotate-45 rounded-[2px] data-[side=bottom]:-top-1 data-[side=left]:-right-1 data-[side=right]:-left-1 data-[side=top]:-bottom-1" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
