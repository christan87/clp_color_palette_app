import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function PaletteDetailPage({ params }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  // Fetch the specific palette with colors
  const palette = await prisma.palette.findUnique({
    where: {
      id: params.id,
    },
    include: {
      colors: true,
    },
  });

  // Check if palette exists and belongs to the user
  if (!palette) {
    notFound();
  }

  if (palette.userId !== session.user.id) {
    redirect("/palettes");
  }

  const formattedDate = new Date(palette.updatedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/palettes"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Palettes
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {palette.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium capitalize">
              {palette.schemeType}
            </span>
            <span>{palette.colors.length} colors</span>
            <span>Updated {formattedDate}</span>
          </div>
        </div>

        {/* Color Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-4">
            {palette.colors.map((color, index) => (
              <div key={color.id} className="group">
                <div
                  className="aspect-square rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-110 border-2 border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.name} - ${color.hex}`}
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                    // You could add a toast notification here
                  }}
                />
                <p className="text-xs text-center mt-2 font-semibold text-gray-700 dark:text-gray-300 truncate">
                  {color.name}
                </p>
                <p className="text-xs text-center font-mono text-gray-500 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {color.hex}
                </p>
                <p className="text-xs text-center text-gray-400 dark:text-gray-600 truncate">
                  {color.company}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => {
              const colorsText = palette.colors.map(c => `${c.name} (${c.hex}) - ${c.company} ${c.code}`).join('\n');
              navigator.clipboard.writeText(colorsText);
            }}
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy All Colors
          </button>

          <Link
            href="/generator"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200"
          >
            Create Similar Palette
          </Link>
        </div>
      </div>
    </div>
  );
}
