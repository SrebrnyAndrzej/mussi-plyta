import Image from "next/image";

export function MussiLogo({ priority = false }: { priority?: boolean }) {
  return (
    <Image
      src="/mussi-logo.png"
      alt="Mussi-Płyta"
      width={120}
      height={56}
      priority={priority}
      className="h-auto w-[96px] sm:w-[108px]"
    />
  );
}
