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
      {/* Spotlight divs removed as requested */}

      {/* Light Mode Logo */}
      <Image
        src="/logo-doualair.png"
        alt="Logo Doualair"
        width={width}
        height={height}
        priority
        className="relative z-10 object-contain dark:hidden"
      />

      {/* Dark Mode Logo */}
      <Image
        src="/logo-dark.png"
        alt="Logo Doualair"
        width={width}
        height={height}
        priority
        className="relative z-10 object-contain hidden dark:block dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
      />
    </div>
  );
}
