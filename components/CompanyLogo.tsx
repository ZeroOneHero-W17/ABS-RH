'use client';

import Image from 'next/image';

type CompanyLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const logoSizes = {
  sm: { width: 160, height: 56 },
  md: { width: 200, height: 70 },
  lg: { width: 210, height: 72 },
};

export function CompanyLogo({ size = 'md', className = '' }: CompanyLogoProps) {
  const { width, height } = logoSizes[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ minWidth: width, minHeight: height }}
    >
      {/* Projecteur — visible uniquement en mode sombre (évite le cercle en thème clair) */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[160%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,rgba(191,219,254,0.22)_40%,rgba(59,130,246,0.1)_60%,transparent_75%)] blur-md dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[120%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-lg dark:block"
        aria-hidden
      />

      <Image
        src="/logo-doualair.png"
        alt="Logo Doualair"
        width={width}
        height={height}
        priority
        className="relative z-10 object-contain dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
      />
    </div>
  );
}
