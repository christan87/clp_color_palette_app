'use client';

import { useState, useEffect } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

extend([namesPlugin]);

export default function GeneratorPage() {
  const router = useRouter();
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [schemeType, setSchemeType] = useState('analogous');
  const [palette, setPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showPaletteOverlay, setShowPaletteOverlay] = useState(false);
  const [palettes, setPalettes] = useState([]);
  const [loadingPalettes, setLoadingPalettes] = useState(false);
  const [addingToPalette, setAddingToPalette] = useState(null);

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

    setPalette(colors);
  };

  useEffect(() => {
    generatePalette();
  }, [baseColor, schemeType]);

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

  const handleColorClick = (color) => {
    setBaseColor(color); // Update base color to clicked color
    setSelectedColor({
      hex: color,
      rgb: colord(color).toRgbString(),
      hsl: colord(color).toHslString(),
      cmyk: getCMYK(color),
    });
    setDrawerOpen(true);
  };

  const fetchPalettes = async () => {
    setLoadingPalettes(true);
    try {
      const response = await fetch('/api/palettes');
      if (response.ok) {
        const data = await response.json();
        setPalettes(data);
      }
    } catch (error) {
      console.error('Error fetching palettes:', error);
    } finally {
      setLoadingPalettes(false);
    }
  };

  const handleAddToPalette = async (paletteId) => {
    setAddingToPalette(paletteId);
    try {
      const colorResponse = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: null,
          hex: selectedColor.hex,
          rgb: selectedColor.rgb,
          hsl: selectedColor.hsl,
          cmyk: selectedColor.cmyk,
          company: null,
          code: null,
        }),
      });

      if (!colorResponse.ok) throw new Error('Failed to create color');
      const createdColor = await colorResponse.json();

      const paletteResponse = await fetch(`/api/palettes/${paletteId}`);
      if (!paletteResponse.ok) throw new Error('Failed to fetch palette');
      const targetPalette = await paletteResponse.json();

      const colorExists = targetPalette.colorIds.some(id => {
        const existingColor = targetPalette.colors.find(c => c.id === id);
        return existingColor?.hex.toLowerCase() === selectedColor.hex.toLowerCase();
      });

      if (colorExists) {
        alert('This color already exists in the palette!');
        setAddingToPalette(null);
        return;
      }

      const updateResponse = await fetch(`/api/palettes/${paletteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetPalette.name,
          schemeType: targetPalette.schemeType,
          access: targetPalette.access,
          colorIds: [...targetPalette.colorIds, createdColor.id],
        }),
      });

      if (!updateResponse.ok) throw new Error('Failed to update palette');

      alert('Color added to palette successfully!');
      setShowPaletteOverlay(false);
    } catch (error) {
      console.error('Error adding to palette:', error);
      alert('Failed to add color to palette');
    } finally {
      setAddingToPalette(null);
    }
  };

  const handleNewPalette = () => {
    router.push(`/palettes/new?color=${selectedColor.hex.replace('#', '')}`);
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

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Your Palette
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {palette.map((color, index) => (
              <div
                key={index}
                className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <div
                  className="h-48 cursor-pointer"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorClick(color)}
                >
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div
                      className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg"
                      style={{ color: getContrastColor(color) }}
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Details
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 text-center">
                  <p className="font-mono text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {color.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    RGB: {colord(color).toRgbString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Export Options */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generatePalette}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Regenerate Palette
              </button>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
            💡 Pro Tips
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Click any color swatch to view details and add to your palettes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Try different scheme types to explore various color harmonies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
              <span>Use the randomize button (🎲) to discover unexpected color combinations</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Color Details Drawer */}
      {drawerOpen && selectedColor && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto">
            <div className="p-6">
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

              <div
                className="w-full h-32 rounded-lg mb-6 shadow-lg"
                style={{ backgroundColor: selectedColor.hex }}
              />

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

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/color?color=${selectedColor.hex.replace('#', '')}`)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
                >
                  View Color
                </button>

                <button
                  onClick={() => {
                    setShowPaletteOverlay(true);
                    fetchPalettes();
                  }}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                >
                  Add to Palette
                </button>

                <button
                  onClick={() => navigator.clipboard.writeText(selectedColor.hex)}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                >
                  Copy Hex Code
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Palette Selection Overlay */}
      {showPaletteOverlay && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowPaletteOverlay(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add to Palette
                  </h3>
                  <button
                    onClick={() => setShowPaletteOverlay(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                {loadingPalettes ? (
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleNewPalette}
                      className="w-full mb-4 p-4 border-2 border-dashed border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 font-semibold"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Palette
                    </button>

                    {palettes.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">
                          No palettes yet. Create your first one!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {palettes.map((pal) => (
                          <button
                            key={pal.id}
                            onClick={() => handleAddToPalette(pal.id)}
                            disabled={addingToPalette === pal.id}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {pal.name}
                              </p>
                              {addingToPalette === pal.id && (
                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {pal.colors.slice(0, 8).map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 rounded"
                                  style={{ backgroundColor: color.hex }}
                                />
                              ))}
                              {pal.colors.length > 8 && (
                                <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                                  +{pal.colors.length - 8}
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
