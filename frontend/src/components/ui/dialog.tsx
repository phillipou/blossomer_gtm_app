import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";

// Overlay
const EditDialogOverlay = React.forwardRef<React.ElementRef<typeof RadixDialog.Overlay>, React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Overlay
      ref={ref}
      className={
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity animate-in fade-in " +
        (className || "")
      }
      {...props}
    />
  )
);
EditDialogOverlay.displayName = RadixDialog.Overlay.displayName;

// Content
const EditDialogContent = React.forwardRef<React.ElementRef<typeof RadixDialog.Content>, React.ComponentPropsWithoutRef<typeof RadixDialog.Content>>(
  ({ className, children, ...props }, ref) => (
    <RadixDialog.Portal>
      <EditDialogOverlay />
      <RadixDialog.Content
        ref={ref}
        className={
          "fixed z-50 left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl border border-gray-200 focus:outline-none " +
          (className || "")
        }
        {...props}
      >
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  )
);
EditDialogContent.displayName = RadixDialog.Content.displayName;

// Header
function EditDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={"px-6 pt-6 pb-2 " + (className || "")}>{children}</div>;
}

// Title
const EditDialogTitle = React.forwardRef<React.ElementRef<typeof RadixDialog.Title>, React.ComponentPropsWithoutRef<typeof RadixDialog.Title>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Title
      ref={ref}
      className={"text-xl font-semibold text-gray-900 " + (className || "")}
      {...props}
    />
  )
);
EditDialogTitle.displayName = RadixDialog.Title.displayName;

// Description
const EditDialogDescription = React.forwardRef<React.ElementRef<typeof RadixDialog.Description>, React.ComponentPropsWithoutRef<typeof RadixDialog.Description>>(
  ({ className, ...props }, ref) => (
    <RadixDialog.Description
      ref={ref}
      className={"text-gray-500 text-sm mt-1 " + (className || "")}
      {...props}
    />
  )
);
EditDialogDescription.displayName = RadixDialog.Description.displayName;

// Footer
function EditDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={"flex justify-end gap-2 px-6 pb-6 pt-2 " + (className || "")}>{children}</div>;
}

// Root
const EditDialog = RadixDialog.Root;
const EditDialogTrigger = RadixDialog.Trigger;

export {
  EditDialog,
  EditDialogTrigger,
  EditDialogContent,
  EditDialogHeader,
  EditDialogTitle,
  EditDialogDescription,
  EditDialogFooter,
}; 