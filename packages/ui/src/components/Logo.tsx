import logo from "@/assets/logo-light.svg";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <img
      src={logo}
      alt="Effect Logo"
      className={cn("h-8 w-8 rounded-sm", className)}
    />
  );
};
