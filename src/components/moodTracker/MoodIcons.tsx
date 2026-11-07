import React from 'react';
import { MoodLevel } from '../../types/mood';
import { MOOD_LEVELS_CONFIG } from '../../services/moodTrackerStorage';
import { Laugh, Smile, Meh, Frown, CloudRain } from 'lucide-react';

interface MoodIconProps {
  level: MoodLevel;
  className?: string;
  size?: number;
}

export const MoodIcon: React.FC<MoodIconProps> = ({ level, className = '', size = 20 }) => {
  switch (level) {
    case 5:
      return <Laugh className={className} size={size} />;
    case 4:
      return <Smile className={className} size={size} />;
    case 3:
      return <Meh className={className} size={size} />;
    case 2:
      return <Frown className={className} size={size} />;
    case 1:
    default:
      return <CloudRain className={className} size={size} />;
  }
};

interface MoodBadgeProps {
  level: MoodLevel;
  showText?: boolean;
  className?: string;
}

export const MoodBadge: React.FC<MoodBadgeProps> = ({ level, showText = true, className = '' }) => {
  const config = MOOD_LEVELS_CONFIG[level] || MOOD_LEVELS_CONFIG[3];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.borderColor} ${config.darkBgColor} ${className}`}
    >
      <MoodIcon level={level} size={15} />
      {showText && <span>{config.label}</span>}
    </span>
  );
};
