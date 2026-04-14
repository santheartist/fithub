import React, { useState } from 'react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Pre-defined color palette for quick selection
  const colorPalette = [
    '#0066cc', // Primary blue
    '#ff6b6b', // Red
    '#ff922b', // Orange
    '#ffd43b', // Yellow
    '#51cf66', // Green
    '#20c997', // Teal
    '#748ffc', // Indigo
    '#a78bfa', // Purple
    '#ec4899', // Pink
    '#6366f1', // Slate
    '#1a1a1a', // Black
    '#ffffff', // White
    '#f5f5f5', // Light Gray
    '#666666', // Gray
  ];

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {label}
      </label>
      {description && (
        <p className="text-xs text-text-secondary mb-2">{description}</p>
      )}
      
      <div className="flex items-center gap-3">
        {/* Color Preview Box */}
        <div
          className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer hover:border-primary transition-colors"
          style={{ backgroundColor: value }}
          onClick={() => setIsOpen(!isOpen)}
        />
        
        {/* Hex Input */}
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              let color = e.target.value;
              // Ensure it's a valid hex color
              if (!color.startsWith('#')) {
                color = '#' + color;
              }
              if (/^#[0-9A-F]{6}$/i.test(color)) {
                onChange(color);
              }
            }}
            placeholder="#000000"
            className="w-full px-3 py-2 border border-border rounded bg-bg-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Color Palette Dropdown */}
      {isOpen && (
        <div className="mt-4 p-4 bg-bg-secondary border border-border rounded-lg">
          <p className="text-xs font-medium text-text-secondary mb-3">Quick Select</p>
          <div className="grid grid-cols-7 gap-2">
            {colorPalette.map((color) => (
              <button
                key={color}
                className={`w-full h-10 rounded border-2 transition-all hover:scale-110 ${
                  value.toUpperCase() === color.toUpperCase()
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                title={color}
              />
            ))}
          </div>
          
          {/* Native Color Picker */}
          <div className="mt-4">
            <p className="text-xs font-medium text-text-secondary mb-2">Custom Color</p>
            <input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              className="w-full h-12 border border-border rounded cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
