import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };
}

export const IconBack = (p: P) => (
  <svg {...base(p)}><path d="M15 5l-7 7 7 7" /></svg>
);
export const IconCart = (p: P) => (
  <svg {...base(p)}><path d="M3 4h2l2.4 11h10.2L20 8H6.2" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const IconHome = (p: P) => (
  <svg {...base(p)}><path d="M3 11l9-7 9 7v9H3z" /><path d="M9 20v-6h6v6" /></svg>
);
export const IconGrid = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base({ strokeWidth: 2.2, ...p })}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = (p: P) => (
  <svg {...base({ strokeWidth: 2.2, ...p })}><path d="M5 12h14" /></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}><path d="M5 12l5 5L20 7" /></svg>
);
export const IconX = (p: P) => (
  <svg {...base({ strokeWidth: 2.4, ...p })}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
);
export const IconGift = (p: P) => (
  <svg {...base(p)}><path d="M20 12v8H4v-8" /><path d="M2 7h20v5H2z" /><path d="M12 22V7" /><path d="M12 7c-2-4-6-4-6-1.5S9 7 12 7c3 0 6-1 6-1.5S14 3 12 7z" /></svg>
);
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconSnow = (p: P) => (
  <svg {...base(p)}><path d="M12 2v20M4 6l16 12M20 6L4 18" /></svg>
);
export const IconScan = (p: P) => (
  <svg {...base(p)}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" /><path d="M7 12h10" /></svg>
);
