import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, MapPin, Star, AlertTriangle } from 'lucide-react';
import { buildingsApi, washroomsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function HomePage() {
  const [buildings, setBuildings] = useState([]);
  const [washrooms, setWashrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(null);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      loadWashrooms();
    }
  }, [selectedBuilding]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWashrooms = async () => {
    setLoading(true);
    try {
      const response = await washroomsApi.getAll({ building_id: selectedBuilding.id });
      setWashrooms(response.data);
    } catch (error) {
      console.error('Error loading washrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group buildings by type
  const groupedBuildings = {
    hostels: buildings.filter(b => b.description === 'Hostel'),
    academic: buildings.filter(b => b.description === 'Academic' || b.description === 'Block' || ['A', 'B', 'K', 'M', 'N', 'P'].includes(b.code)),
    food: buildings.filter(b => ['Mess', 'Paid Mess', 'Food Court'].includes(b.description)),
  };

  // Get unique floors from washrooms - sort numerically
  const floors = [...new Set(washrooms.map(w => w.floor_name))].sort((a, b) => {
    if (a === 'Ground Floor') return -1;
    if (b === 'Ground Floor') return 1;
    // Extract floor numbers and sort numerically
    const numA = parseInt(a.replace('Floor ', '')) || 0;
    const numB = parseInt(b.replace('Floor ', '')) || 0;
    return numA - numB;
  });

  // Filter washrooms by selected floor
  const filteredWashrooms = selectedFloor 
    ? washrooms.filter(w => w.floor_name === selectedFloor)
    : [];

  const handleBack = () => {
    if (selectedFloor) {
      setSelectedFloor(null);
    } else if (selectedBuilding) {
      setSelectedBuilding(null);
      setWashrooms([]);
    }
  };

  // Step 1: Select Building
  if (!selectedBuilding) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            🚻 Find a Washroom
          </h1>
          <p className="text-gray-500">Select a building to get started</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-6">
            {/* Hostels */}
            {groupedBuildings.hostels.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                  🏠 Hostels
                </h2>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {groupedBuildings.hostels.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => setSelectedBuilding(building)}
                      className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-xl p-3 text-center transition-all"
                    >
                      <span className="text-lg font-bold text-blue-700">{building.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Blocks */}
            {groupedBuildings.academic.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                  🏫 Academic Blocks
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {groupedBuildings.academic.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => setSelectedBuilding(building)}
                      className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-xl p-4 text-center transition-all"
                    >
                      <span className="text-xl font-bold text-purple-700">{building.code}</span>
                      <p className="text-xs text-purple-500 mt-1">Block</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Food Places */}
            {groupedBuildings.food.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
                  🍽️ Food & Dining
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {groupedBuildings.food.map((building) => (
                    <button
                      key={building.id}
                      onClick={() => setSelectedBuilding(building)}
                      className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-400 rounded-xl p-4 text-left transition-all flex items-center gap-3"
                    >
                      <span className="text-2xl">
                        {building.code === 'MESS' ? '🍛' : building.code === 'PM' ? '🍽️' : '☕'}
                      </span>
                      <span className="font-semibold text-orange-700">{building.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Step 2: Select Floor
  if (!selectedFloor) {
    return (
      <div className="space-y-6">
        {/* Header with Back */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{selectedBuilding.name}</h1>
            <p className="text-gray-500 text-sm">Select a floor</p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {floors.map((floor) => {
              const floorWashrooms = washrooms.filter(w => w.floor_name === floor);
              return (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-400 rounded-xl p-4 text-center transition-all"
                >
                  <span className="text-lg font-bold text-gray-800">{floor}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {floorWashrooms.length} washroom{floorWashrooms.length !== 1 ? 's' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Step 3: Select Washroom
  return (
    <div className="space-y-6">
      {/* Header with Back */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{selectedBuilding.name}</h1>
          <p className="text-gray-500 text-sm">{selectedFloor}</p>
        </div>
      </div>

      {/* Washrooms List */}
      <div className="space-y-3">
        {filteredWashrooms.map((washroom) => (
          <Link
            key={washroom.id}
            to={`/washroom/${washroom.id}`}
            className="block bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-primary-400 rounded-xl p-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {washroom.gender === 'male' ? '🚹' : washroom.gender === 'female' ? '🚺' : '🚻'}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {washroom.gender === 'male' ? 'Male Washroom' : 
                     washroom.gender === 'female' ? 'Female Washroom' : 'Washroom'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {washroom.average_rating > 0 ? (
                      <span className="flex items-center gap-1 text-sm text-amber-600">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {washroom.average_rating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No ratings yet</span>
                    )}
                    {washroom.open_issues > 0 && (
                      <span className="flex items-center gap-1 text-sm text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        {washroom.open_issues}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
