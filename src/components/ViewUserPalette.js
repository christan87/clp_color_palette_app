'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colord } from 'colord';
import Link from 'next/link';

export default function ViewUserPalette({ palette, currentUserId }) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showDuplicateOverlay, setShowDuplicateOverlay] = useState(false);
  const [duplicatePaletteName, setDuplicatePaletteName] = useState(`${palette.name} (Copy)`);
  const [duplicating, setDuplicating] = useState(false);
  const [showPaletteOverlay, setShowPaletteOverlay] = useState(false);
  const [palettes, setPalettes] = useState([]);
  const [loadingPalettes, setLoadingPalettes] = useState(false);
  const [addingToPalette, setAddingToPalette] = useState(null);

  const isOwner = palette.userId === currentUserId;

  const handleColorClick = (color) => {
    setSelectedColor(color);
    setDrawerOpen(true);
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

  const handleDuplicatePalette = async () => {
    if (!duplicatePaletteName.trim()) {
      alert('Please enter a palette name');
      return;
    }

    setDuplicating(true);

    try {
      // Create colors first
      const colorIds = [];
      for (const color of palette.colors) {
        const response = await fetch('/api/colors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: color.name || null,
            hex: color.hex,
            rgb: color.rgb,
            hsl: color.hsl,
            cmyk: color.cmyk,
            company: color.company || null,
            code: color.code || null,
          }),
        });

        if (!response.ok) throw new Error('Failed to create color');
        const createdColor = await response.json();
        colorIds.push(createdColor.id);
      }

      // Create the palette
      const paletteResponse = await fetch('/api/palettes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: duplicatePaletteName,
          schemeType: palette.schemeType,
          access: 'PRIVATE',
          colorIds,
        }),
      });

      if (!paletteResponse.ok) throw new Error('Failed to create palette');

      alert('Palette duplicated successfully!');
      setShowDuplicateOverlay(false);
      router.push('/palettes');
    } catch (error) {
      console.error('Error duplicating palette:', error);
      alert('Failed to duplicate palette. Please try again.');
    } finally {
      setDuplicating(false);
    }
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
          name: selectedColor.name || null,
          hex: selectedColor.hex,
          rgb: selectedColor.rgb,
          hsl: selectedColor.hsl,
          cmyk: selectedColor.cmyk,
          company: selectedColor.company || null,
          code: selectedColor.code || null,
        }),
      });

      if (!colorResponse.ok) throw new Error('Failed to create color');
      const createdColor = await colorResponse.json();

      // Get the palette
      const paletteResponse = await fetch(`/api/palettes/${paletteId}`);
      if (!paletteResponse.ok) throw new Error('Failed to fetch palette');
      const targetPalette = await paletteResponse.json();

      // Check if color already exists
      const colorExists = targetPalette.colorIds.some(id => {
        const existingColor = targetPalette.colors.find(c => c.id === id);
        return existingColor?.hex.toLowerCase() === selectedColor.hex.toLowerCase();
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

  // Chunk colors into rows of 5
  const colorRows = [];
  for (let i = 0; i < palette.colors.length; i += 5) {
    colorRows.push(palette.colors.slice(i, i + 5));
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/palettes"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Palettes
        </Link>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                {palette.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Created by <span className="font-semibold">{palette.user.name || palette.user.email}</span>
              </p>
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium capitalize">
                  {palette.schemeType}
                </span>
                <span>{palette.colors.length} colors</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {palette.access === 'PUBLIC' ? '🌐 Public' : palette.access === 'FRIENDS' ? '👥 Friends' : '🔒 Private'}
                </span>
              </div>
            </div>

            {!isOwner && (
              <button
                onClick={() => setShowDuplicateOverlay(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg"
              >
                Duplicate Palette
              </button>
            )}
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            Colors
          </h2>
          <div className="space-y-4">
            {colorRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {row.map((color) => (
                  <div
                    key={color.id}
                    className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                    onClick={() => handleColorClick(color)}
                  >
                    <div
                      className="h-32"
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
                          <span className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            View Info
                          </span>
                        </div>
                      </div>
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
            ))}
          </div>
        </div>
      </div>

      {/* Color Info Drawer */}
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
                  Color Info
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

              {/* Color Details */}
              {(selectedColor.name || selectedColor.company || selectedColor.code) && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">COLOR DETAILS</p>
                  {selectedColor.name && (
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Name: </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedColor.name}</span>
                    </div>
                  )}
                  {selectedColor.company && (
                    <div className="mb-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Company: </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedColor.company}</span>
                    </div>
                  )}
                  {selectedColor.code && (
                    <div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Code: </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedColor.code}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
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

      {/* Duplicate Palette Overlay */}
      {showDuplicateOverlay && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDuplicateOverlay(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Duplicate Palette
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter a name for your new palette
              </p>
              <input
                type="text"
                value={duplicatePaletteName}
                onChange={(e) => setDuplicatePaletteName(e.target.value)}
                placeholder="Palette name"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-6"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDuplicatePalette}
                  disabled={duplicating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {duplicating ? 'Duplicating...' : 'Duplicate'}
                </button>
                <button
                  onClick={() => setShowDuplicateOverlay(false)}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                >
                  Cancel
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
