'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AccountSettings({ user, friendRequests }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name || '');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // profile, friends, followers, following, requests
  const [processingRequest, setProcessingRequest] = useState(null);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      alert('Profile updated successfully!');
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;

    try {
      const response = await fetch('/api/users/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });

      if (!response.ok) throw new Error('Failed to remove friend');

      alert('Friend removed successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await fetch('/api/users/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Failed to unfollow');

      alert('Unfollowed successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error unfollowing:', error);
      alert('Failed to unfollow. Please try again.');
    }
  };

  const handleFriendRequest = async (requestId, action) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch('/api/users/friend-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} friend request`);

      alert(`Friend request ${action}ed successfully!`);
      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing friend request:`, error);
      alert(`Failed to ${action} friend request. Please try again.`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const renderUserList = (users, actionButton) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No users to display</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-3"
          >
            {u.image ? (
              <img
                src={u.image}
                alt={u.name || u.email}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {u.name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <Link
                href={`/users/${u.id}`}
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
              >
                {u.name || 'Unnamed User'}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {u.email}
              </p>
            </div>
            {actionButton && actionButton(u)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your profile and connections
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('friends')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'friends'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Friends ({user.friends.length})
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'followers'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Followers ({user.followers.length})
              </button>
              <button
                onClick={() => setActiveTab('following')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'following'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Following ({user.following.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors relative ${
                  activeTab === 'requests'
                    ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Requests ({friendRequests.length})
                {friendRequests.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || user.email}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                      {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {user.name || 'Unnamed User'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Member since {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Profile Information
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email}
                          disabled
                          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Email cannot be changed
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setName(user.name || '');
                          }}
                          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {user.name || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {user.friends.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Friends</p>
                    </div>
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                        {user.followers.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {user.following.length}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Your Friends
                </h3>
                {renderUserList(user.friends, (friend) => (
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Remove
                  </button>
                ))}
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === 'followers' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Your Followers
                </h3>
                {renderUserList(user.followers)}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === 'following' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  People You Follow
                </h3>
                {renderUserList(user.following, (followedUser) => (
                  <button
                    onClick={() => handleUnfollow(followedUser.id)}
                    className="px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    Unfollow
                  </button>
                ))}
              </div>
            )}

            {/* Friend Requests Tab */}
            {activeTab === 'requests' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Friend Requests
                </h3>
                {friendRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No pending friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-3"
                      >
                        {request.sender.image ? (
                          <img
                            src={request.sender.image}
                            alt={request.sender.name || request.sender.email}
                            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                            {request.sender.name?.[0]?.toUpperCase() || request.sender.email[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/users/${request.sender.id}`}
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 truncate block"
                          >
                            {request.sender.name || 'Unnamed User'}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {request.sender.email}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFriendRequest(request.id, 'accept')}
                            disabled={processingRequest === request.id}
                            className="px-3 py-1 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingRequest === request.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(request.id, 'reject')}
                            disabled={processingRequest === request.id}
                            className="px-3 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
