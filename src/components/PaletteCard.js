import Link from "next/link";

export default function PaletteCard({ palette }) {
  // Take first 45 colors for the preview grid (9x5)
  const previewColors = palette.colors.slice(0, 45);
  
  // Format date
  const formattedDate = new Date(palette.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <Link 
      href={`/palettes/${palette.id}`}
      className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:scale-105"
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
  );
}
