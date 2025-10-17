import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "primary" | "dark" | "light";
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-3",
};

const colorClasses = {
  primary: "border-[#4ADE80] border-t-transparent",
  dark: "border-[#0A1612] border-t-transparent",
  light: "border-[#E5F5ED] border-t-transparent",
};

export function Spinner({ size = "md", className, color = "primary" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "rounded-full animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}
