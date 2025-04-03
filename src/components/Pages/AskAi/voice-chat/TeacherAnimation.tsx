import React, { useEffect, useState } from 'react';

interface TeacherAnimationProps {
  isSpeaking: boolean;
}

const TeacherAnimation: React.FC<TeacherAnimationProps> = ({ isSpeaking }) => {
  const [mouthSize, setMouthSize] = useState(5);
  const [blinkEyes, setBlinkEyes] = useState(false);
  const [bodyOffset, setBodyOffset] = useState(0);
  
  // Animate mouth when speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthSize(5);
      return;
    }
    
    // Create mouth animation
    let direction = 'increasing';
    const interval = setInterval(() => {
      setMouthSize(current => {
        if (direction === 'increasing') {
          const newSize = current + 2;
          if (newSize >= 20) direction = 'decreasing';
          return newSize;
        } else {
          const newSize = current - 2;
          if (newSize <= 5) direction = 'increasing';
          return newSize;
        }
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Add blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkEyes(true);
      setTimeout(() => setBlinkEyes(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Add subtle body movement
  useEffect(() => {
    const bodyAnimationInterval = setInterval(() => {
      setBodyOffset(prev => prev === 0 ? 2 : 0);
    }, 2000);
    
    return () => clearInterval(bodyAnimationInterval);
  }, []);

  return (
    <div className="w-[220px] h-[220px] flex items-center justify-center rounded-full bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg border border-gray-700 overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          width="200" 
          height="200" 
          viewBox="0 0 200 200" 
          style={{ transform: `translateY(${bodyOffset}px)` }}
          className="transition-transform duration-1000"
        >
          {/* Background glow for the teacher */}
          <circle
            cx="100"
            cy="100"
            r="75" 
            fill="rgba(70, 130, 180, 0.2)"
            className={isSpeaking ? "animate-pulse" : ""}
          />
          
          {/* Hair */}
          <path 
            d="M45,80 C45,40 155,40 155,80 L155,105 C155,75 45,75 45,105 Z" 
            fill="#8B4513" 
          />
          
          {/* Face */}
          <ellipse 
            cx="100" 
            cy="100" 
            rx="40" 
            ry="50" 
            fill="#FFDBAC" 
          />
          
          {/* Eyes - animated with blinking */}
          <ellipse 
            cx="85" 
            cy="90" 
            rx="5" 
            ry={blinkEyes ? 0.5 : 7} 
            fill="#000000" 
            className="transition-all duration-100"
          />
          <ellipse 
            cx="115" 
            cy="90" 
            rx="5" 
            ry={blinkEyes ? 0.5 : 7} 
            fill="#000000" 
            className="transition-all duration-100"
          />
          
          {/* Eyebrows */}
          <path 
            d="M75,78 Q85,73 95,78" 
            stroke="#8B4513" 
            strokeWidth="2.5" 
            fill="none" 
          />
          <path 
            d="M125,78 Q115,73 105,78" 
            stroke="#8B4513" 
            strokeWidth="2.5" 
            fill="none" 
          />
          
          {/* Mouth - animated based on speaking state */}
          <ellipse 
            cx="100" 
            cy="115" 
            rx="15" 
            ry={mouthSize} 
            fill="#FF6B6B" 
            className="transition-all duration-100"
          />
          
          {/* Neck */}
          <rect
            x="92"
            y="140"
            width="16"
            height="15"
            fill="#FFDBAC"
          />
          
          {/* Body/Dress */}
          <path 
            d="M50,155 L60,200 L140,200 L150,155" 
            fill="#4682B4" 
          />
          
          {/* Collar/Necklace */}
          <path 
            d="M70,155 C70,165 130,165 130,155" 
            stroke="#FFD700" 
            strokeWidth="3" 
            fill="none" 
          />
          
          {/* Glasses */}
          <rect 
            x="75" 
            y="85" 
            width="20" 
            height="12" 
            rx="5" 
            fill="none" 
            stroke="#000000" 
            strokeWidth="2.5" 
          />
          <rect 
            x="105" 
            y="85" 
            width="20" 
            height="12" 
            rx="5" 
            fill="none" 
            stroke="#000000" 
            strokeWidth="2.5" 
          />
          <line 
            x1="95" 
            y1="91" 
            x2="105" 
            y2="91" 
            stroke="#000000" 
            strokeWidth="2.5" 
          />
          
          {/* Earrings */}
          <circle
            cx="60"
            cy="100"
            r="3"
            fill="#FFD700"
            className={isSpeaking ? "animate-pulse" : ""}
          />
          <circle
            cx="140"
            cy="100"
            r="3"
            fill="#FFD700"
            className={isSpeaking ? "animate-pulse" : ""}
          />
        </svg>
      </div>
    </div>
  );
};

export default TeacherAnimation; 