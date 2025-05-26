import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      {/* Simplified "T" like shape or abstract connection visual */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20 20 H80 V30 H55 V80 H45 V30 H20 V20Z"
        className="text-primary"
      />
      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary opacity-30" />
       <path d="M40 60 L50 50 L60 60" stroke="currentColor" strokeWidth="5" fill="none" className="text-accent" />
       <path d="M45 40 L50 50 L55 40" stroke="currentColor" strokeWidth="5" fill="none" className="text-accent" />
    </svg>
  );
}
