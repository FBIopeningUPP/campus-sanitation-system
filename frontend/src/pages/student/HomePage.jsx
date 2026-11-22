import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, Filter, MapPin, AlertTriangle } from 'lucide-react';
import { buildingsApi, washroomsApi } from '../../services/api';
import { RatingDisplay } from '../../components/common/StarRating';
import { GenderBadge } from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HomePage() {
  const [buildings, setBuildings] = useState([]);
  const [washrooms, setWashrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    loadWashrooms();
  }, [selectedBuilding, selectedGender, searchQuery]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const loadWashrooms = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBuilding) params.building_id = selectedBuilding;
      if (selectedGender) params.gender = selectedGender;
      if (searchQuery) params.search = searchQuery;
      
      const response = await washroomsApi.getAll(params);
      setWashrooms(response.data);
    } catch (error) {
      console.error('Error loading washrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Campus Sanitation Rating System
        </h1>
        <p className="text-primary-100 mb-4">
          Help us maintain clean washrooms across Bennett University. Rate facilities and report issues anonymously.
        </p>
        <div className="flex flex-wrap gap-3">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            🎯 SDG 6: Clean Water & Sanitation
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
            🔒 100% Anonymous
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search washrooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Building Filter */}
          <div className="md:w-48">
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="input"
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="md:w-40">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="input"
            >
              <option value="">All Types</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {loading ? 'Loading...' : `${washrooms.length} Washrooms Found`}
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : washrooms.length === 0 ? (
          <div className="card p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No washrooms found matching your filters.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {washrooms.map((washroom) => (
              <Link
                key={washroom.id}
                to={`/washroom/${washroom.id}`}
                className="card-hover p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {washroom.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {washroom.building_name} • {washroom.floor_name}
                    </p>
                  </div>
                  <GenderBadge gender={washroom.gender} />
                </div>

                <div className="flex items-center justify-between">
                  <RatingDisplay
                    rating={washroom.average_rating}
                    totalRatings={washroom.total_ratings}
                  />
                  {washroom.open_issues > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {washroom.open_issues} issues
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
