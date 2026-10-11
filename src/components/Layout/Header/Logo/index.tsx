import Link from "next/link";
import Image from "next/image";

const Logo: React.FC<{ className?: string; name?: string }> = ({ className = "text-slate-900", name = "Shahzaib Royal Academy" }) => {
  return (
    <Link href="/" aria-label={`${name} home`} className={`flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl ${className}`}>
      <Image src="/images/logo/logo-placeholder.svg" alt="" width={40} height={40} priority />
      <span>{name}</span>
    </Link>
  );
};

export default Logo;
