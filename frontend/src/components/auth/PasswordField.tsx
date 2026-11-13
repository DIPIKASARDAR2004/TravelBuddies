import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Input } from "@/components/ui/Input";

interface PasswordFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  visible: boolean;
  onToggleVisibility: () => void;
  error?: string;
  onBlur?: () => void;
  autoComplete?: "current-password" | "new-password";
}

export function PasswordField({
  label,
  name,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisibility,
  error,
  onBlur,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <div className="relative">
      <Input
        label={label}
        name={name}
        type={visible ? "text" : "password"}
        required
        autoComplete={autoComplete}
        maxLength={1024}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        error={error}
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-4 top-10 flex items-center text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
      >
        {visible ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}
