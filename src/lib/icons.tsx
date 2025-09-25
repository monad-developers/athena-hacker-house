import type { SVGProps } from 'react';

export const UsdcBirdIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="45" fill="#4CAF50" />
    <circle cx="35" cy="40" r="8" fill="white" />
    <circle cx="35" cy="40" r="4" fill="black" />
    <circle cx="65" cy="40" r="8" fill="white" />
    <circle cx="65" cy="40" r="4" fill="black" />
    <text x="50" y="75" fontFamily="Arial, sans-serif" fontSize="30" fill="white" textAnchor="middle" fontWeight="bold">$</text>
  </svg>
);

export const MonBirdIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M50 10 C 90 10, 90 90, 50 90 C 10 90, 10 10, 50 10 Z" fill="#F44336" />
    <path d="M 40 0 L 50 20 L 60 0 Z" fill="#FFC107" />
    <circle cx="35" cy="45" r="8" fill="white" />
    <circle cx="35" cy="45" r="4" fill="black" />
    <circle cx="65" cy="45" r="8" fill="white" />
    <circle cx="65" cy="45" r="4" fill="black" />
    <path d="M 40 70 Q 50 80 60 70" stroke="white" strokeWidth="4" fill="none" />
  </svg>
);

export const WethBirdIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <polygon points="50,10 90,90 10,90" fill="#FFEB3B" />
    <circle cx="40" cy="65" r="6" fill="white" />
    <circle cx="40" cy="65" r="3" fill="black" />
    <circle cx="60" cy="65" r="6" fill="white" />
    <circle cx="60" cy="65" r="3" fill="black" />
    <path d="M45,40 L50,60 L55,40" stroke="#3F51B5" strokeWidth="5" fill="none" />
    <path d="M45,50 L55,50" stroke="#3F51B5" strokeWidth="5" fill="none" />
  </svg>
);


export const UsdcIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#2775CA" />
    <text x="50" y="68" fontFamily="Poppins, sans-serif" fontSize="50" fill="white" textAnchor="middle" fontWeight="bold">
      $
    </text>
  </svg>
);

export const MonIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#E91E63" />
    <text x="50" y="68" fontFamily="Poppins, sans-serif" fontSize="30" fill="white" textAnchor="middle" fontWeight="bold">
      MON
    </text>
  </svg>
);

export const WethIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="50" fill="#627EEA" />
    <polygon points="50,20 75,45 50,70 25,45" fill="white" opacity="0.7" />
    <polygon points="50,20 25,45 50,45" fill="white" />
    <polygon points="50,52 25,52 50,70 75,52" fill="white" opacity="0.7"/>
    <polygon points="50,52 25,52 50,70" fill="white" />
  </svg>
);
