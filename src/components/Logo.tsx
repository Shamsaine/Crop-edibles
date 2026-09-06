import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  textColor?: string;
  leafColor?: string;
}

export default function Logo({
  className = '',
  size = 120,
  textColor = 'text-primary',
  leafColor = '#3a5930',
}: LogoProps) {
  return (
    <div 
      className={`relative flex flex-col items-center justify-center ${className}`} 
      style={{ width: size, height: size }}
      id="edible-official-logo"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definitions for text paths */}
        <defs>
          {/* Top arc for CROP text - curving clockwise over the top */}
          <path 
            id="top-text-arc" 
            d="M 38,92 A 66,66 0 0,1 162,92" 
            fill="none" 
          />
          {/* Bottom arc for Edibles text - curving clockwise under the bottom */}
          <path 
            id="bottom-text-arc" 
            d="M 38,112 A 66,66 0 0,0 162,112" 
            fill="none" 
          />
        </defs>

        {/* 1. Curved Branch of Leaves on Top-Right */}
        <g id="top-right-leaf-branch">
          {/* Stem */}
          <path 
            d="M 110,32 Q 142,32 174,72" 
            stroke={leafColor} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            opacity="0.85"
          />
          {/* Leaf 1 */}
          <path 
            d="M 112,32 C 114,20 128,21 131,23 C 131,23 124,34 116,34 Z" 
            fill={leafColor} 
          />
          {/* Leaf 2 */}
          <path 
            d="M 125,31 C 131,20 144,24 146,27 C 146,27 137,35 129,33 Z" 
            fill={leafColor} 
          />
          {/* Leaf 3 */}
          <path 
            d="M 138,34 C 147,25 158,32 159,35 C 159,35 149,41 141,37 Z" 
            fill={leafColor} 
          />
          {/* Leaf 4 */}
          <path 
            d="M 150,41 C 160,34 169,43 170,46 C 170,46 159,50 152,45 Z" 
            fill={leafColor} 
          />
          {/* Leaf 5 */}
          <path 
            d="M 160,51 C 170,46 177,56 177,59 C 177,59 166,61 160,55 Z" 
            fill={leafColor} 
          />
          {/* Leaf 6 */}
          <path 
            d="M 167,63 C 176,61 180,71 179,74 C 179,74 169,73 166,67 Z" 
            fill={leafColor} 
          />
          {/* Leaf 7 */}
          <path 
            d="M 172,77 C 179,77 181,87 180,90 C 180,90 171,87 170,81 Z" 
            fill={leafColor} 
          />
        </g>

        {/* 2. Side dots and ticks */}
        <circle cx="28" cy="103" r="5" className={`fill-current ${textColor}`} />
        <circle cx="172" cy="103" r="5" className={`fill-current ${textColor}`} />
        
        {/* Diagonal ticks under the side dots */}
        <line 
          x1="40" y1="128" 
          x2="50" y2="144" 
          className={`stroke-current ${textColor}`} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />
        <line 
          x1="160" y1="128" 
          x2="150" y2="144" 
          className={`stroke-current ${textColor}`} 
          strokeWidth="3.5" 
          strokeLinecap="round" 
        />

        {/* 3. Text Arcs (CROP & Edibles) */}
        <text className={`fill-current ${textColor} font-serif font-extrabold tracking-widest text-[20px]`}>
          <textPath href="#top-text-arc" startOffset="32%" textAnchor="middle">
            CROP
          </textPath>
        </text>

        <text className={`fill-current ${textColor} font-serif font-bold text-[19px]`}>
          <textPath href="#bottom-text-arc" startOffset="50%" textAnchor="middle">
            Edibles
          </textPath>
        </text>

        {/* 4. Center Stylized Leaves */}
        <g id="center-leaves" transform="translate(94, 102) scale(1.4)">
          {/* Three small leaves */}
          <g>
            {/* Leaf 1 (Pointing Up-Right) */}
            <path 
              d="M0,8 C2,-4 14,-2 16,-2 C16,-2 12,10 2,12 Z" 
              fill={leafColor} 
              transform="rotate(-5 8 5)"
            />
            {/* Leaf 2 (Pointing Right) */}
            <path 
              d="M3,15 C9,5 19,7 20,9 C20,9 15,17 5,17 Z" 
              fill={leafColor} 
              transform="rotate(15 10 12)"
            />
            {/* Leaf 3 (Pointing Up) */}
            <path 
              d="M-5,-1 C-6,-13 4,-17 6,-17 C6,-17 6,-7 -2,-1 Z" 
              fill={leafColor} 
              transform="rotate(-25 0 -9)"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
