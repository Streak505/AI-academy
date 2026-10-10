import Link from "next/link";
import Image from "next/image";
import { academy } from "@/config/academy";

const Logo: React.FC<{ className?: string }> = ({ className = "text-slate-900" }) => {
  return (
    <Link href="/" aria-label={`${academy.name} home`} className={`flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl ${className}`}>
      <Image src="/images/logo/logo-placeholder.svg" alt="" width={40} height={40} priority />
      <span>{academy.name}</span>
    </Link>
  );
};

export default Logo;
