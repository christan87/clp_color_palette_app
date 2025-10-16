'use client';

import { useState, useEffect } from 'react';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import mixPlugin from 'colord/plugins/mix';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

extend([namesPlugin, mixPlugin]);

export default function ColorPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [originalColor, setOriginalColor] = useState('#6366f1');
  const [editedColor, setEditedColor] = useState('#6366f1');
  const [hasEdits, setHasEdits] = useState(false);
  
  // Color adjustments
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [tint, setTint] = useState(0);
  const [shade, setShade] = useState(0);
  
  // Color details
  const [colorName, setColorName] = useState('');
  const [company, setCompany] = useState('');
  const [code, setCode] = useState('');
  
  // Palette overlay
  const [showPaletteOverlay, setShowPaletteOverlay] = useState(false);
  const [palettes, setPalettes] = useState([]);
  const [loadingPalettes, setLoadingPalettes] = useState(false);
  const [addingToPalette, setAddingToPalette] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Initialize color from URL or default
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const colorParam = params.get('color');
    if (colorParam) {
      const color = colorParam.startsWith('#') ? colorParam : `#${colorParam}`;
      setOriginalColor(color);
      setEditedColor(color);
      updateSlidersFromColor(color);
    }
  }, []);

  const updateSlidersFromColor = (hexColor) => {
    const color = colord(hexColor);
    const hsl = color.toHsl();
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
    setTint(0);
    setShade(0);
  };

  // Update edited color when sliders change
  useEffect(() => {
    let color = colord({ h: hue, s: saturation, l: lightness });
    
    // Apply tint (mix with white)
    if (tint > 0) {
      color = color.mix('#ffffff', tint / 100);
    }
    
    // Apply shade (mix with black)
    if (shade > 0) {
      color = color.mix('#000000', shade / 100);
    }
    
    const newColor = color.toHex();
    setEditedColor(newColor);
    setHasEdits(newColor !== originalColor);
  }, [hue, saturation, lightness, tint, shade, originalColor]);

  const resetColor = () => {
    updateSlidersFromColor(originalColor);
    setEditedColor(originalColor);
    setHasEdits(false);
  };

  const applyEditedColor = () => {
    setOriginalColor(editedColor);
    setHasEdits(false);
  };

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
      // Create the color first
      const colorResponse = await fetch('/api/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: colorName || null,
          hex: editedColor,
          rgb: colord(editedColor).toRgbString(),
          hsl: colord(editedColor).toHslString(),
          cmyk: getCMYK(editedColor),
          company: company || null,
          code: code || null,
        }),
      });

      if (!colorResponse.ok) throw new Error('Failed to create color');
      const createdColor = await colorResponse.json();

      // Get the palette
      const paletteResponse = await fetch(`/api/palettes/${paletteId}`);
      if (!paletteResponse.ok) throw new Error('Failed to fetch palette');
      const palette = await paletteResponse.json();

      // Check if color already exists
      const colorExists = palette.colorIds.some(id => {
        const existingColor = palette.colors.find(c => c.id === id);
        return existingColor?.hex.toLowerCase() === editedColor.toLowerCase();
      });

      if (colorExists) {
        alert('This color already exists in the palette!');
        setAddingToPalette(null);
        return;
      }

      // Update the palette with the new color
      const updateResponse = await fetch(`/api/palettes/${paletteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: palette.name,
          schemeType: palette.schemeType,
          access: palette.access,
          colorIds: [...palette.colorIds, createdColor.id],
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
    // Navigate to new palette page with color as query param
    router.push(`/palettes/new?color=${editedColor.replace('#', '')}`);
  };

  const displayColor = hasEdits ? editedColor : originalColor;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="flex flex-col lg:flex-row lg:h-screen">
        {/* Main Color Display Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[50vh] lg:min-h-0">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center w-full max-w-2xl">
            {/* Original Color */}
            <div className="text-center flex-1">
              <div
                className="w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-2xl shadow-2xl border-4 border-white dark:border-gray-700 transition-all duration-300 mx-auto"
                style={{ backgroundColor: originalColor }}
              />
              <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                Original
              </p>
              <p className="text-base sm:text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                {originalColor.toUpperCase()}
              </p>
            </div>

            {/* Arrow */}
            {hasEdits && (
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}

            {/* Edited Color */}
            {hasEdits && (
              <div className="text-center flex-1">
                <div
                  className="w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 rounded-2xl shadow-2xl border-4 border-white dark:border-gray-700 transition-all duration-300 mx-auto"
                  style={{ backgroundColor: editedColor }}
                />
                <p className="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                  Edited
                </p>
                <p className="text-base sm:text-lg font-mono font-bold text-gray-900 dark:text-gray-100">
                  {editedColor.toUpperCase()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-30 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>

        {/* Right Drawer - Always Open on Desktop, Toggleable on Mobile */}
        <div className={`${
          mobileDrawerOpen ? 'fixed inset-0 z-40' : 'hidden'
        } lg:relative lg:block w-full lg:w-96 bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto border-l border-gray-200 dark:border-gray-700`}>
          <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Color Editor
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Adjust and save your color
                </p>
              </div>
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Color Wheel Picker */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Color Picker
              </label>
              <input
                type="color"
                value={editedColor}
                onChange={(e) => {
                  setEditedColor(e.target.value);
                  updateSlidersFromColor(e.target.value);
                }}
                className="w-full h-32 rounded-lg cursor-pointer border-2 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Hue Slider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Hue: {Math.round(hue)}°
              </label>
              <input
                type="range"
                min="0"
                max="360"
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
                }}
              />
            </div>

            {/* Saturation Slider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Saturation: {Math.round(saturation)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-400 to-blue-600"
              />
            </div>

            {/* Lightness Slider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Lightness: {Math.round(lightness)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={lightness}
                onChange={(e) => setLightness(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-black via-gray-500 to-white"
              />
            </div>

            {/* Tint Slider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Tint (Add White): {Math.round(tint)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={tint}
                onChange={(e) => setTint(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-600 to-white"
              />
            </div>

            {/* Shade Slider */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Shade (Add Black): {Math.round(shade)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={shade}
                onChange={(e) => setShade(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-400 to-black"
              />
            </div>

            {/* Color Codes */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">COLOR CODES</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">HEX:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{displayColor.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">RGB:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{colord(displayColor).toRgbString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">HSL:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{colord(displayColor).toHslString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CMYK:</span>
                  <span className="font-mono text-gray-900 dark:text-gray-100">{getCMYK(displayColor)}</span>
                </div>
              </div>
            </div>

            {/* Color Details */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Color Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={colorName}
                onChange={(e) => setColorName(e.target.value)}
                placeholder="e.g., Ocean Blue"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Company <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Sherwin-Williams"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Color Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., SW 6494"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {hasEdits && (
                <>
                  <button
                    onClick={applyEditedColor}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-md"
                  >
                    Apply Changes
                  </button>
                  <button
                    onClick={resetColor}
                    className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                  >
                    Reset to Original
                  </button>
                </>
              )}
              
              <button
                onClick={() => {
                  setShowPaletteOverlay(true);
                  fetchPalettes();
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md"
              >
                Add to Palette
              </button>

              <button
                onClick={() => navigator.clipboard.writeText(displayColor)}
                className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
              >
                Copy Hex Code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Palette Selection Overlay */}
      {showPaletteOverlay && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowPaletteOverlay(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
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

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
                {loadingPalettes ? (
                  <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {/* New Palette Button */}
                    <button
                      onClick={handleNewPalette}
                      className="w-full mb-4 p-4 border-2 border-dashed border-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400 font-semibold"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create New Palette
                    </button>

                    {/* Existing Palettes */}
                    {palettes.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">
                          No palettes yet. Create your first one!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {palettes.map((palette) => (
                          <button
                            key={palette.id}
                            onClick={() => handleAddToPalette(palette.id)}
                            disabled={addingToPalette === palette.id}
                            className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">
                                {palette.name}
                              </p>
                              {addingToPalette === palette.id && (
                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {palette.colors.slice(0, 8).map((color, idx) => (
                                <div
                                  key={idx}
                                  className="w-8 h-8 rounded"
                                  style={{ backgroundColor: color.hex }}
                                />
                              ))}
                              {palette.colors.length > 8 && (
                                <div className="w-8 h-8 rounded bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs">
                                  +{palette.colors.length - 8}
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
