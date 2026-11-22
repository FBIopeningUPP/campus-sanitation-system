import { Star } from 'lucide-react';

export default function StarRating({ rating, onRate, size = 'md', readonly = false }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  const sizeClass = sizes[size] || sizes.md;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-200'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingDisplay({ rating, totalRatings, size = 'sm' }) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={Math.round(rating)} size={size} readonly />
      <span className="text-sm text-gray-600">
        {rating?.toFixed(1) || '0.0'} ({totalRatings || 0})
      </span>
    </div>
  );
}
