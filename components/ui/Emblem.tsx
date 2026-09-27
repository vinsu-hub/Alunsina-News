import Image from "next/image";

export function Emblem({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/alunsina-emblem.png"
      width={512}
      height={512}
      alt=""
      aria-hidden="true"
      className={`h-9 w-9 object-contain ${className}`}
    />
  );
}
