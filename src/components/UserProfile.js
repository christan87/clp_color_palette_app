'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserProfile({ user, palettes, currentUserId, isFriend, isFollowing }) {
  const router = useRouter();
  const [addingFriend, setAddingFriend] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const [followLoading, setFollowLoading] = useState(false);

  const handleAddFriend = async () => {
    setAddingFriend(true);
    try {
      const response = await fetch('/api/users/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: user.id }),
      });

      if (!response.ok) throw new Error('Failed to add friend');

      alert('Friend request sent successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error adding friend:', error);
      alert('Failed to add friend. Please try again.');
    } finally {
      setAddingFriend(false);
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      const response = await fetch('/api/users/follow', {
        method: following ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) throw new Error(`Failed to ${following ? 'unfollow' : 'follow'}`);

      setFollowing(!following);
      router.refresh();
    } catch (error) {
      console.error(`Error ${following ? 'unfollowing' : 'following'}:`, error);
      alert(`Failed to ${following ? 'unfollow' : 'follow'}. Please try again.`);
    } finally {
      setFollowLoading(false);
    }
  };

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
          Back
        </Link>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {user.name || 'Unnamed User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{user.email}</p>
              
              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {palettes.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    Palettes
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {user.followerIds.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    Followers
                  </span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {user.followingIds.length}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    Following
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              {!isFriend && (
                <button
                  onClick={handleAddFriend}
                  disabled={addingFriend}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingFriend ? 'Adding...' : '👥 Add Friend'}
                </button>
              )}
              {isFriend && (
                <div className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg font-semibold text-center">
                  ✓ Friends
                </div>
              )}
              
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  following
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                }`}
              >
                {followLoading ? 'Loading...' : following ? 'Following' : '+ Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Palettes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
            {user.name}'s Palettes
            {isFriend && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-3">
                (Including friend palettes)
              </span>
            )}
          </h2>

          {palettes.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <svg 
                  className="w-8 h-8 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No palettes yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {user.name} hasn't created any public palettes yet
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {palettes.map((palette) => (
                <Link
                  key={palette.id}
                  href={`/palettes/user/${palette.id}`}
                  className="group relative bg-gray-50 dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-600 hover:scale-105"
                >
                  {/* Color Grid Preview */}
                  <div className="aspect-[9/5] grid grid-cols-9 grid-rows-5 gap-0">
                    {palette.colors.slice(0, 45).map((color, index) => (
                      <div
                        key={index}
                        className="w-full h-full transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                        title={color.hex}
                      />
                    ))}
                    {/* Fill remaining cells if less than 45 colors */}
                    {palette.colors.length < 45 && 
                      Array.from({ length: 45 - palette.colors.length }).map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="w-full h-full bg-gray-100 dark:bg-gray-600"
                        />
                      ))
                    }
                  </div>

                  {/* Palette Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {palette.name}
                      </h3>
                      {palette.access === 'FRIENDS' && (
                        <span className="text-xs">👥</span>
                      )}
                      {palette.access === 'PUBLIC' && (
                        <span className="text-xs">🌐</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{palette.schemeType}</span>
                      <span>{palette.colors.length} colors</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Updated {new Date(palette.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
