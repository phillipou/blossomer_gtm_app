import * as React from "react";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onChange, disabled = false, ...props }, ref) => (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        ref={ref}
        {...props}
      />
      <div
        className={`w-10 h-6 bg-gray-200 rounded-full peer-focus:ring-2 peer-focus:ring-blue-500 transition-colors duration-200 peer-checked:bg-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <div
          className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 peer-checked:translate-x-4 ${
            disabled ? "bg-gray-100" : ""
          }`}
        />
      </div>
    </label>
  )
);
Switch.displayName = "Switch";

export default Switch; 