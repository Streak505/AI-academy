import Link from "next/link";

const Logo: React.FC<{ className?: string }> = ({ className = "text-slate-900" }) => {
  return (
    <Link href="/" className={`text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl ${className}`}>
      AI Academy
    </Link>
  );
};

export default Logo;
