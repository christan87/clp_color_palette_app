'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaletteCard({ palette }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // Take first 45 colors for the preview grid (9x5)
  const previewColors = palette.colors.slice(0, 45).map(color => color.hex);
  
  // Format date
  const formattedDate = new Date(palette.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleDelete = async (e) => {
    e.preventDefault(); // Prevent navigation to detail page
    
    if (!confirm(`Are you sure you want to delete "${palette.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/palettes/${palette.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete palette');
      }

      router.refresh(); // Refresh the page to show updated list
    } catch (error) {
      console.error('Error deleting palette:', error);
      alert('Failed to delete palette. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-2 right-2 z-10 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title="Delete palette"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <Link 
        href={`/palettes/${palette.id}`}
        className="block"
      >
      {/* Color Grid Preview */}
      <div className="aspect-[9/5] grid grid-cols-9 grid-rows-5 gap-0">
        {previewColors.map((color, index) => (
          <div
            key={index}
            className="w-full h-full transition-transform group-hover:scale-110"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        {/* Fill remaining cells if less than 45 colors */}
        {previewColors.length < 45 && 
          Array.from({ length: 45 - previewColors.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-full h-full bg-gray-100 dark:bg-gray-700"
            />
          ))
        }
      </div>

      {/* Palette Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {palette.name}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span className="capitalize">{palette.schemeType}</span>
          <span>{palette.colors.length} colors</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Updated {formattedDate}
        </p>
      </div>
      </Link>
    </div>
  );
}
