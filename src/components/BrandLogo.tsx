import React from 'react';
import brainGlowBadge from '../assets/images/psiconnect_brain_glow_badge_1793757777196.jpg';
import brainCircuitsIcon from '../assets/images/psiconnect_brain_circuits_icon_1793757765655.jpg';

export interface BrandLogoProps {
  /**
   * 'glow': stylized human brain with luminous synapses & colorful circuit motherboard traces
   * 'chip': cybernetic circular dark badge with glowing rainbow circuit brain
   */
  variant?: 'glow' | 'chip';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  subtitle?: string | boolean;
  textDark?: boolean;
  className?: string;
  badgeClassName?: string;
  animated?: boolean;
}

const sizeMap = {
  xs: { img: 'w-6 h-6', text: 'text-base', sub: 'text-[9px]' },
  sm: { img: 'w-8 h-8', text: 'text-lg', sub: 'text-[10px]' },
  md: { img: 'w-10 h-10', text: 'text-xl', sub: 'text-[11px]' },
  lg: { img: 'w-13 h-13', text: 'text-2xl', sub: 'text-xs' },
  xl: { img: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  '2xl': { img: 'w-24 h-24', text: 'text-4xl', sub: 'text-base' },
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'glow',
  size = 'md',
  showText = true,
  subtitle = true,
  textDark = true,
  className = '',
  badgeClassName = '',
  animated = false,
}) => {
  const currentSize = sizeMap[size] || sizeMap.md;
  const imageSrc = variant === 'chip' ? brainCircuitsIcon : brainGlowBadge;

  const defaultSubtitleText = 'Terapias & Aconselhamento Bíblico';
  const subtitleText = typeof subtitle === 'string' ? subtitle : subtitle ? defaultSubtitleText : null;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Brain & Circuits Logo Icon Badge */}
      <div
        className={`relative shrink-0 rounded-2xl overflow-hidden p-0.5 shadow-sm transition-all duration-300 ${
          variant === 'chip'
            ? 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 ring-1 ring-cyan-500/30 shadow-cyan-500/10'
            : 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-amber-400 p-[1.5px] shadow-indigo-100 ring-1 ring-slate-200/60'
        } ${animated ? 'hover:scale-105 hover:shadow-md hover:ring-2 hover:ring-cyan-400/70' : ''} ${badgeClassName}`}
      >
        <div
          className={`w-full h-full rounded-[14px] overflow-hidden ${
            variant === 'chip' ? 'bg-slate-950' : 'bg-white dark:bg-slate-900'
          } flex items-center justify-center`}
        >
          <img
            src={imageSrc}
            alt="PsiConnect - Cérebro Humano com Circuitos Coloridos"
            className={`${currentSize.img} object-contain transition-transform duration-300 ${
              animated ? 'group-hover:scale-110' : ''
            }`}
            loading="eager"
          />
        </div>

        {/* Ambient subtle circuit pulse glow indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* Typography / Wordmark */}
      {showText && (
        <div className="leading-tight">
          <div className={`font-bold tracking-tight ${currentSize.text} flex items-center gap-0.5`}>
            <span className={textDark ? 'text-slate-900 dark:text-white' : 'text-white'}>Psi</span>
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 dark:from-sky-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-extrabold">
              Connect
            </span>
          </div>

          {subtitleText && (
            <p
              className={`font-medium tracking-normal mt-0.5 ${currentSize.sub} ${
                textDark ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300'
              }`}
            >
              {subtitleText}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
