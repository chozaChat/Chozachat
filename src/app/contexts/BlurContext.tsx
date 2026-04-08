import React, { createContext, useContext, useState, useEffect } from 'react';

interface BlurContextType {
  blurStrength: number;
  setBlurStrength: (strength: number) => void;
}

const BlurContext = createContext<BlurContextType | undefined>(undefined);

export const BlurProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blurStrength, setBlurStrengthState] = useState(() => {
    const saved = localStorage.getItem('blurStrength');
    return saved !== null ? parseInt(saved) : 10; // Default to 10px
  });

  useEffect(() => {
    localStorage.setItem('blurStrength', blurStrength.toString());
  }, [blurStrength]);

  const setBlurStrength = (strength: number) => {
    setBlurStrengthState(strength);
  };

  return (
    <BlurContext.Provider value={{ blurStrength, setBlurStrength }}>
      {children}
    </BlurContext.Provider>
  );
};

export const useBlur = () => {
  const context = useContext(BlurContext);
  if (context === undefined) {
    throw new Error('useBlur must be used within a BlurProvider');
  }
  return context;
};