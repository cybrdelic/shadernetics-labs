import React, { useState, useEffect, useRef } from 'react';
import { MenuItem } from '../../types';

interface MenuBarProps {
  menus: MenuItem[];
  appTitle?: string;
}

export const MenuBar: React.FC<MenuBarProps> = ({ menus, appTitle = "BOLD.SIM" }) => {
  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-10 w-full bg-zinc-900 border-b border-zinc-800 flex items-center px-4 select-none z-50" ref={menuRef}>
      <div className="mr-6 text-sm font-semibold text-zinc-200 tracking-tight flex items-center gap-2">
        {appTitle}
      </div>
      
      <div className="flex h-full items-center">
        {menus.map((menu, index) => (
          <div key={menu.label} className="relative h-full flex items-center">
            <button
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeMenuIndex === index 
                  ? 'bg-zinc-800 text-white' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
              onClick={() => setActiveMenuIndex(activeMenuIndex === index ? null : index)}
              onMouseEnter={() => {
                if (activeMenuIndex !== null) setActiveMenuIndex(index);
              }}
            >
              {menu.label}
            </button>

            {activeMenuIndex === index && menu.items && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-800 border border-zinc-700 shadow-xl rounded-md overflow-hidden py-1 z-50">
                {menu.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    className="w-full text-left px-4 py-1.5 text-xs text-zinc-300 hover:bg-blue-600 hover:text-white flex justify-between items-center group transition-colors"
                    onClick={() => {
                      item.action?.();
                      setActiveMenuIndex(null);
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="text-[10px] text-zinc-500 group-hover:text-blue-200 font-sans">
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-4">
         <span className="text-[10px] text-zinc-600">v2.1.0-stable</span>
      </div>
    </div>
  );
};