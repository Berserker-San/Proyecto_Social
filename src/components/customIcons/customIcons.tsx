
import React from 'react';

interface IconProps {
    size?: number | string;
    className?: string;
    strokeWidth?: number;
}

// Improved Rugby Icon (Vertical Prolate Spheroid)
export const RugbyIcon: React.FC<IconProps> = ({ size = 24, className = "", strokeWidth = 2 }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {/* Main Body - Upright Oval */}
        <path d="M12 2C7 2 4 6.5 4 12C4 17.5 7 22 12 22C17 22 20 17.5 20 12C20 6.5 17 2 12 2Z" />
        {/* Horizontal Seams (Panels) */}
        <path d="M4.5 9C6.5 8 17.5 8 19.5 9" opacity="0.6"/>
        <path d="M4.5 15C6.5 16 17.5 16 19.5 15" opacity="0.6"/>
        {/* Laces area (small distinctive detail) */}
        <path d="M10 12H14" />
        <path d="M12 10V14" />
    </svg>
);

export const UltimateIcon: React.FC<IconProps> = ({ size = 24, className = "", strokeWidth = 2 }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {/* Outer Rim */}
        <circle cx="12" cy="12" r="10" />
        {/* Inner Flight Plate Edge */}
        <circle cx="12" cy="12" r="6" opacity="0.8" />
        {/* Spin/Motion Lines */}
        <path d="M12 22C6.477 22 2 17.523 2 12" strokeDasharray="4 4" opacity="0.4" />
    </svg>
);

// SOROCA: Seed/Light concept
export const SorocaIcon: React.FC<IconProps> = ({ size = 24, className = "", strokeWidth = 2 }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        {/* Seed Shape / Drop */}
        <path d="M12 22C12 22 5 16 5 10C5 6.13401 8.13401 3 12 3C15.866 3 19 6.13401 19 10C19 16 12 22 12 22Z" />
        {/* Internal Life/Leaf */}
        <path d="M12 16C12 16 9 13 9 10C9 8.34315 10.3431 7 12 7" opacity="0.6"/>
    </svg>
);

// TRIBU: Shield/Unity Concept
export const TribuIcon: React.FC<IconProps> = ({ size = 24, className = "", strokeWidth = 2 }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M12 22S3 18 3 5L12 2L21 5C21 18 12 22 12 22Z" />
        <path d="M8 10L12 14L16 10" />
        <path d="M12 2V14" opacity="0.5"/>
    </svg>
);
