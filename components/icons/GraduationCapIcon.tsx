import React from 'react';

interface GraduationCapIconProps {
  className?: string;
}

export const GraduationCapIcon: React.FC<GraduationCapIconProps> = ({ className = "h-6 w-6" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <g transform="rotate(-15 12 12)">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/>
        </g>
    </svg>
);
