'use client';

import { useState, useEffect } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

extend([namesPlugin]);

export default function NewPalettePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [schemeType, setSchemeType] = useState('analogous');
  const [colorOptions, setColorOptions] = useState([]); // Generated color options
  const [selectedPalette, setSelectedPalette] = useState([]); // Colors added to palette
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteName, setPaletteName] = useState('');
  const [saving, setSaving] = useState(false);

  // Color details for the selected color
  const [colorDetails, setColorDetails] = useState({
    name: '',
    company: '',
    code: '',
  });

  const schemeTypes = [
    { value: 'analogous', label: 'Analogous', description: 'Colors adjacent on the color wheel' },
    { value: 'complementary', label: 'Complementary', description: 'Opposite colors on the wheel' },
    { value: 'triadic', label: 'Triadic', description: 'Three evenly spaced colors' },
    { value: 'tetradic', label: 'Tetradic', description: 'Four colors in two pairs' },
    { value: 'monochromatic', label: 'Monochromatic', description: 'Variations of a single hue' },
  ];

  const generatePalette = () => {
    const base = colord(baseColor);
    let colors = [];

    switch (schemeType) {
      case 'analogous':
        colors = [
          base.rotate(-30).toHex(),
          base.rotate(-15).toHex(),
          baseColor,
          base.rotate(15).toHex(),
          base.rotate(30).toHex(),
        ];
        break;

      case 'complementary':
        colors = [
          base.lighten(0.2).toHex(),
          base.lighten(0.1).toHex(),
          baseColor,
          base.rotate(180).toHex(),
          base.rotate(180).darken(0.1).toHex(),
        ];
        break;

      case 'triadic':
        colors = [
          baseColor,
          base.rotate(120).toHex(),
          base.rotate(240).toHex(),
          base.lighten(0.2).toHex(),
          base.rotate(120).lighten(0.2).toHex(),
        ];
        break;

      case 'tetradic':
        colors = [
          baseColor,
          base.rotate(90).toHex(),
          base.rotate(180).toHex(),
          base.rotate(270).toHex(),
          base.lighten(0.15).toHex(),
        ];
        break;

      case 'monochromatic':
        colors = [
          base.darken(0.3).toHex(),
          base.darken(0.15).toHex(),
          baseColor,
          base.lighten(0.15).toHex(),
          base.lighten(0.3).toHex(),
        ];
        break;

      default:
        colors = [baseColor];
    }

    setColorOptions(colors.map(hex => ({
      hex,
      rgb: colord(hex).toRgbString(),
      hsl: colord(hex).toHslString(),
      cmyk: getCMYK(hex),
    })));
  };

  useEffect(() => {
    generatePalette();
  }, [baseColor, schemeType]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const getCMYK = (hex) => {
    const rgb = colord(hex).toRgb();
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return `${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%`;
  };

  const getContrastColor = (hexColor) => {
    const color = colord(hexColor);
    return color.isLight() ? '#000000' : '#ffffff';
  };

  const sortColorsByHue = (colors) => {
    return [...colors].sort((a, b) => {
      const hslA = colord(a.hex).toHsl();
      const hslB = colord(b.hex).toHsl();
      
      // Sort by hue first
      if (Math.abs(hslA.h - hslB.h) > 1) {
        return hslA.h - hslB.h;
      }
      
      // If hues are similar, sort by saturation
      if (Math.abs(hslA.s - hslB.s) > 1) {
        return hslB.s - hslA.s;
      }
      
      // If saturation is similar, sort by lightness
      return hslA.l - hslB.l;
    });
  };

  const randomizeColor = () => {
    const randomColor = colord({
      h: Math.random() * 360,
      s: 50 + Math.random() * 50,
      l: 40 + Math.random() * 30,
    }).toHex();
    setBaseColor(randomColor);
  };

  const handleColorClick = (index) => {
    setSelectedColorIndex(index);
    setColorDetails({
      name: '',
      company: '',
      code: '',
    });
    setDrawerOpen(true);
  };

  const handleAddColor = () => {
    const selectedColor = colorOptions[selectedColorIndex];
    
    // Check if color already exists in palette (by hex code)
    const colorExists = selectedPalette.some(
      color => color.hex.toLowerCase() === selectedColor.hex.toLowerCase()
    );
    
    if (colorExists) {
      alert(`Color ${selectedColor.hex.toUpperCase()} already exists in your palette!`);
      return;
    }
    
    const newColor = {
      ...selectedColor,
      name: colorDetails.name || '',
      company: colorDetails.company || '',
      code: colorDetails.code || '',
    };
    const updatedPalette = sortColorsByHue([...selectedPalette, newColor]);
    setSelectedPalette(updatedPalette);
    setDrawerOpen(false);
    setSelectedColorIndex(null);
    setColorDetails({ name: '', company: '', code: '' });
  };

  const handleRemoveColor = (index) => {
    const updatedPalette = selectedPalette.filter((_, i) => i !== index);
    setSelectedPalette(sortColorsByHue(updatedPalette));
  };

  const handleSavePalette = async () => {
    if (!paletteName.trim()) {
      alert('Please enter a palette name');
      return;
    }

    if (selectedPalette.length === 0) {
      alert('Please add at least one color to your palette');
      return;
    }

    setSaving(true);

    try {
      // First, create all colors
      const colorIds = [];
      for (const color of selectedPalette) {
        const response = await fetch('/api/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: color.name,
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
            cmyk: color.cmyk,
            company: color.company,
            code: color.code,
          }),
        });

        if (!response.ok) throw new Error('Failed to create color');
        const createdColor = await response.json();
        colorIds.push(createdColor.id);
      }

      // Then create the palette
      const paletteResponse = await fetch('/api/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: paletteName,
          schemeType,
          colorIds,
        }),
      });

      if (!paletteResponse.ok) throw new Error('Failed to create palette');

      router.push('/palettes');
    } catch (error) {
      console.error('Error saving palette:', error);
      alert('Failed to save palette. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const selectedColor = selectedColorIndex !== null ? colorOptions[selectedColorIndex] : null;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
            Create New Palette
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate colors and add details to create your palette
          </p>
        </div>

        {/* Palette Name */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Palette Name
          </label>
          <input
            type="text"
            value={paletteName}
            onChange={(e) => setPaletteName(e.target.value)}
            placeholder="e.g., Ocean Breeze, Sunset Vibes"
            className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color Picker */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Base Color
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBaseColor(e.target.value)}
                    className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="#000000"
                />
                <button
                  onClick={randomizeColor}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                  title="Random Color"
                >
                  🎲
                </button>
              </div>
            </div>

            {/* Scheme Type */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Color Scheme
              </label>
              <select
                value={schemeType}
                onChange={(e) => setSchemeType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                {schemeTypes.map((scheme) => (
                  <option key={scheme.value} value={scheme.value}>
                    {scheme.label} - {scheme.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Color Options */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Color Options
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {colorOptions.map((color, index) => (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                onClick={() => handleColorClick(index)}
              >
                <div
                  className="h-48"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div
                      className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg"
                      style={{ color: getContrastColor(color.hex) }}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Click to add
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3">
                  <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">
                    {color.hex.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your Palette */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Your Palette
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3">
              ({selectedPalette.length} {selectedPalette.length === 1 ? 'color' : 'colors'})
            </span>
          </h2>
          {selectedPalette.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <svg 
                className="w-16 h-16 mx-auto text-gray-400 mb-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">
                Click colors above to add them to your palette
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedPalette.map((color, index) => (
                <div
                  key={index}
                  className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                >
                  <div
                    className="h-32"
                    style={{ backgroundColor: color.hex }}
                  >
                    <button
                      onClick={() => handleRemoveColor(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      title="Remove color"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3">
                    <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                      {color.hex.toUpperCase()}
                    </p>
                    {color.name && (
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 font-semibold truncate">
                        {color.name}
                      </p>
                    )}
                    {color.company && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {color.company} {color.code}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Save/Cancel Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="flex gap-4">
            <button
              onClick={handleSavePalette}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Palette'}
            </button>
            <button
              onClick={() => router.push('/palettes')}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Color Details Drawer */}
      {drawerOpen && selectedColor && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Color Details
                </h3>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Color Preview */}
              <div
                className="w-full h-32 rounded-lg mb-6 shadow-lg"
                style={{ backgroundColor: selectedColor.hex }}
              />

              {/* Color Codes */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    HEX
                  </label>
                  <p className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                    {selectedColor.hex.toUpperCase()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    RGB
                  </label>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedColor.rgb}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    HSL
                  </label>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedColor.hsl}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    CMYK
                  </label>
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {selectedColor.cmyk}
                  </p>
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Color Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={colorDetails.name}
                    onChange={(e) => setColorDetails({ ...colorDetails, name: e.target.value })}
                    placeholder="e.g., Ocean Blue"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Company <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={colorDetails.company}
                    onChange={(e) => setColorDetails({ ...colorDetails, company: e.target.value })}
                    placeholder="e.g., Sherwin-Williams"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                    Color Code <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={colorDetails.code}
                    onChange={(e) => setColorDetails({ ...colorDetails, code: e.target.value })}
                    placeholder="e.g., SW 6494"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Update Button */}
              <button
                onClick={handleAddColor}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Add to Palette
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
