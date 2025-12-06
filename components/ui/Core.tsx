import React, { InputHTMLAttributes, ButtonHTMLAttributes, useState, useRef, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { X, GripHorizontal } from 'lucide-react';

// Utility for merging tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// -- WINDOW SYSTEM --

interface DraggableWindowProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  initialPosition: { x: number; y: number };
  className?: string;
  children: React.ReactNode;
  zIndex: number;
  onFocus: () => void;
}

export const DraggableWindow = React.memo<DraggableWindowProps>(({ 
  title, 
  isOpen, 
  onClose, 
  initialPosition, 
  className, 
  children,
  zIndex,
  onFocus
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    onFocus();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={windowRef}
      className={cn(
        "fixed flex flex-col bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 shadow-2xl rounded-sm overflow-hidden",
        className
      )}
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: zIndex,
        boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)' : undefined
      }}
      onMouseDown={onFocus}
    >
      {/* Header / Drag Handle */}
      <div 
        className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-2 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal size={14} className="text-zinc-500" />
          <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wide">{title}</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
});

// -- CONTROLS --

interface BoldButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' | 'icon';
}

export const BoldButton: React.FC<BoldButtonProps> = ({ children, className, variant = 'solid', ...props }) => {
  const baseStyles = "px-3 py-1.5 rounded-sm text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    solid: "bg-blue-700 text-white hover:bg-blue-600 shadow-sm border border-transparent",
    outline: "bg-zinc-800 border border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800",
    icon: "p-1.5 bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-sm"
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export const BoldInput: React.FC<InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input 
    className={cn(
      "w-full bg-zinc-950 border border-zinc-700 rounded-sm px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 placeholder:text-zinc-600 transition-all font-sans",
      className
    )} 
    {...props} 
  />
);

export const BoldToggle: React.FC<{ label: string; checked: boolean; onChange: (c: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 cursor-pointer group select-none">
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={cn("w-7 h-3.5 bg-zinc-700 rounded-full transition-colors", checked && "bg-blue-600")}></div>
      <div className={cn("absolute left-0 top-0 bg-zinc-300 w-3.5 h-3.5 rounded-full shadow-sm border border-zinc-600 transition-transform", checked && "translate-x-full border-blue-500 bg-white")}></div>
    </div>
    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider group-hover:text-zinc-300">{label}</span>
  </label>
);