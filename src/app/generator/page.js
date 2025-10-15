'use client';

import { useState, useEffect } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import Link from 'next/link';

extend([namesPlugin]);

export default function GeneratorPage() {
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [schemeType, setSchemeType] = useState('analogous');
  const [palette, setPalette] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

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

  const copyToClipboard = async (color, index) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold">Back to Home</span>
            </Link>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Color Palette Generator
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  onClick={() => copyToClipboard(color, index)}
                >
                  <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div
                      className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg"
                      style={{ color: getContrastColor(color) }}
                    >
                      {copiedIndex === index ? (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Click to copy
                        </span>
                      )}
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
              Export Palette
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(palette.join(', '), -1)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                {copiedIndex === -1 ? '✓ Copied All!' : 'Copy All Colors'}
              </button>
              <button
                onClick={generatePalette}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
              >
                Regenerate
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
              <span>Click any color swatch to copy its hex code to your clipboard</span>
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
      </main>
    </div>
  );
}
