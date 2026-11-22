import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { washroomsApi } from '../../services/api';
import { RatingDisplay } from '../../components/common/StarRating';
import { GenderBadge } from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function RankingsPage() {
  const [topWashrooms, setTopWashrooms] = useState([]);
  const [bottomWashrooms, setBottomWashrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('top');

  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const [topRes, bottomRes] = await Promise.all([
        washroomsApi.getRankings({ limit: 10, order: 'desc' }),
        washroomsApi.getRankings({ limit: 10, order: 'asc' }),
      ]);
      setTopWashrooms(topRes.data);
      setBottomWashrooms(bottomRes.data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index, isTop) => {
    if (index === 0) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 font-bold">
          🥇
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-300 text-gray-700 font-bold">
          🥈
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="w-8 h-8 flex items-center justify-center rounded-full bg-amber-600 text-amber-100 font-bold">
          🥉
        </span>
      );
    }
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
        {index + 1}
      </span>
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading rankings..." />;
  }

  const displayList = activeTab === 'top' ? topWashrooms : bottomWashrooms;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-bold">Washroom Rankings</h1>
        </div>
        <p className="text-yellow-100">
          See which washrooms are performing best and which need improvement
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('top')}
          className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'top'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          Top Rated
        </button>
        <button
          onClick={() => setActiveTab('bottom')}
          className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'bottom'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingDown className="w-5 h-5" />
          Needs Improvement
        </button>
      </div>

      {/* Rankings List */}
      {displayList.length === 0 ? (
        <div className="card p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No ratings yet. Be the first to rate a washroom!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((washroom, index) => (
            <Link
              key={washroom.id}
              to={`/washroom/${washroom.id}`}
              className="card-hover p-4 flex items-center gap-4"
            >
              {getRankBadge(index, activeTab === 'top')}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {washroom.name}
                  </h3>
                  <GenderBadge gender={washroom.gender} />
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {washroom.building_name} • {washroom.floor_name}
                </p>
              </div>

              <div className="text-right">
                <RatingDisplay
                  rating={washroom.average_rating}
                  totalRatings={washroom.total_ratings}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
