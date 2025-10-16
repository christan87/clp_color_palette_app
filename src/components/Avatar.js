export default function Avatar({ user, size = 'md' }) {
  const sizeClasses = {
    xs: 'w-8 h-8 text-sm',
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-3xl',
  };

  const initial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  if (user?.image) {
    return (
      <img
        src={user.image}
        alt={user.name || user.email || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initial}
    </div>
  );
}
