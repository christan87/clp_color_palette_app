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
  const [palette, setPalette] = useState([]);
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

    setPalette(colors.map(hex => ({
      hex,
      name: '',
      company: '',
      code: '',
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
      name: palette[index].name || '',
      company: palette[index].company || '',
      code: palette[index].code || '',
    });
    setDrawerOpen(true);
  };

  const handleUpdateColor = () => {
    const updatedPalette = [...palette];
    updatedPalette[selectedColorIndex] = {
      ...updatedPalette[selectedColorIndex],
      ...colorDetails,
    };
    setPalette(updatedPalette);
    setDrawerOpen(false);
    setSelectedColorIndex(null);
  };

  const handleSavePalette = async () => {
    if (!paletteName.trim()) {
      alert('Please enter a palette name');
      return;
    }

    if (palette.some(c => !c.name || !c.company || !c.code)) {
      alert('Please add details (name, company, code) for all colors');
      return;
    }

    setSaving(true);

    try {
      // First, create all colors
      const colorIds = [];
      for (const color of palette) {
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

  const selectedColor = selectedColorIndex !== null ? palette[selectedColorIndex] : null;

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

        {/* Palette Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Your Palette
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {palette.map((color, index) => (
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Click to edit
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3">
                  <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200 text-center">
                    {color.hex.toUpperCase()}
                  </p>
                  {color.name && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1 truncate">
                      {color.name}
                    </p>
                  )}
                  {color.company && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center truncate">
                      {color.company} {color.code}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
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
                    Color Name *
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
                    Company *
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
                    Color Code *
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
                onClick={handleUpdateColor}
                disabled={!colorDetails.name || !colorDetails.company || !colorDetails.code}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Color
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
