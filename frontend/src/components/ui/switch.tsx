import * as React from "react";

// Force Tailwind JIT to include peer-checked:translate-x-4 for Switch animation
// tailwind-jit-classes: peer-checked:translate-x-4

export const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ checked, onChange, disabled, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer select-none w-10 h-6">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ref={ref}
        {...props}
      />
      {/* Track */}
      <span className="block w-10 h-6 bg-gray-200 rounded-full transition-colors duration-200 peer-checked:bg-blue-500" />
      {/* Thumb */}
      <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-4" />
    </label>
  )
);
Switch.displayName = "Switch";
export default Switch;