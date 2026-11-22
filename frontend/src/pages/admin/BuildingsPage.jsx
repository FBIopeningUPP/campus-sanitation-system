import { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Layers,
  X
} from 'lucide-react';
import { buildingsApi, floorsApi, washroomsApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { GenderBadge } from '../../components/common/StatusBadge';

export default function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [washrooms, setWashrooms] = useState([]);
  
  // Modal states
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showWashroomModal, setShowWashroomModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', description: '' });
  const [floorForm, setFloorForm] = useState({ floor_number: 0, floor_name: '' });
  const [washroomForm, setWashroomForm] = useState({ name: '', gender: 'unisex' });

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      loadFloors(selectedBuilding.id);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedFloor) {
      loadWashrooms(selectedFloor.id);
    }
  }, [selectedFloor]);

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

  const loadFloors = async (buildingId) => {
    try {
      const response = await floorsApi.getAll(buildingId);
      setFloors(response.data);
    } catch (error) {
      console.error('Error loading floors:', error);
    }
  };

  const loadWashrooms = async (floorId) => {
    try {
      const response = await washroomsApi.getAll({ floor_id: floorId });
      setWashrooms(response.data);
    } catch (error) {
      console.error('Error loading washrooms:', error);
    }
  };

  // Building CRUD
  const handleSaveBuilding = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await buildingsApi.update(editingItem.id, buildingForm);
      } else {
        await buildingsApi.create(buildingForm);
      }
      loadBuildings();
      setShowBuildingModal(false);
      setBuildingForm({ name: '', code: '', description: '' });
      setEditingItem(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save building');
    }
  };

  const handleDeleteBuilding = async (id) => {
    if (!confirm('Delete this building and all its floors/washrooms?')) return;
    try {
      await buildingsApi.delete(id);
      loadBuildings();
      if (selectedBuilding?.id === id) {
        setSelectedBuilding(null);
        setFloors([]);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete building');
    }
  };

  // Floor CRUD
  const handleSaveFloor = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await floorsApi.update(editingItem.id, floorForm);
      } else {
        await floorsApi.create({ ...floorForm, building_id: selectedBuilding.id });
      }
      loadFloors(selectedBuilding.id);
      setShowFloorModal(false);
      setFloorForm({ floor_number: 0, floor_name: '' });
      setEditingItem(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save floor');
    }
  };

  const handleDeleteFloor = async (id) => {
    if (!confirm('Delete this floor and all its washrooms?')) return;
    try {
      await floorsApi.delete(id);
      loadFloors(selectedBuilding.id);
      if (selectedFloor?.id === id) {
        setSelectedFloor(null);
        setWashrooms([]);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete floor');
    }
  };

  // Washroom CRUD
  const handleSaveWashroom = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await washroomsApi.update(editingItem.id, washroomForm);
      } else {
        await washroomsApi.create({ ...washroomForm, floor_id: selectedFloor.id });
      }
      loadWashrooms(selectedFloor.id);
      setShowWashroomModal(false);
      setWashroomForm({ name: '', gender: 'unisex' });
      setEditingItem(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save washroom');
    }
  };

  const handleDeleteWashroom = async (id) => {
    if (!confirm('Delete this washroom?')) return;
    try {
      await washroomsApi.delete(id);
      loadWashrooms(selectedFloor.id);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete washroom');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading buildings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Buildings</h1>
          <p className="text-gray-500">Add and manage campus buildings, floors, and washrooms</p>
        </div>
        <button
          onClick={() => {
            setBuildingForm({ name: '', code: '', description: '' });
            setEditingItem(null);
            setShowBuildingModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Building
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Buildings Column */}
        <div className="card">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Buildings ({buildings.length})
            </h2>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {buildings.map((building) => (
              <div
                key={building.id}
                onClick={() => {
                  setSelectedBuilding(building);
                  setSelectedFloor(null);
                  setWashrooms([]);
                }}
                className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                  selectedBuilding?.id === building.id ? 'bg-primary-50' : ''
                }`}
              >
                <div>
                  <p className="font-medium text-gray-800">{building.name}</p>
                  <p className="text-sm text-gray-500">{building.code} • {building.floor_count} floors</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setBuildingForm({
                        name: building.name,
                        code: building.code,
                        description: building.description || ''
                      });
                      setEditingItem(building);
                      setShowBuildingModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-primary-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBuilding(building.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floors Column */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Floors {selectedBuilding && `(${floors.length})`}
            </h2>
            {selectedBuilding && (
              <button
                onClick={() => {
                  setFloorForm({ floor_number: floors.length, floor_name: '' });
                  setEditingItem(null);
                  setShowFloorModal(true);
                }}
                className="p-1 text-primary-600 hover:text-primary-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {!selectedBuilding ? (
              <p className="p-4 text-gray-500 text-center">Select a building</p>
            ) : floors.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No floors yet</p>
            ) : (
              floors.map((floor) => (
                <div
                  key={floor.id}
                  onClick={() => setSelectedFloor(floor)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                    selectedFloor?.id === floor.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-800">{floor.floor_name}</p>
                    <p className="text-sm text-gray-500">{floor.washroom_count} washrooms</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFloorForm({
                          floor_number: floor.floor_number,
                          floor_name: floor.floor_name
                        });
                        setEditingItem(floor);
                        setShowFloorModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-primary-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFloor(floor.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Washrooms Column */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">
              Washrooms {selectedFloor && `(${washrooms.length})`}
            </h2>
            {selectedFloor && (
              <button
                onClick={() => {
                  setWashroomForm({ name: '', gender: 'unisex' });
                  setEditingItem(null);
                  setShowWashroomModal(true);
                }}
                className="p-1 text-primary-600 hover:text-primary-800"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {!selectedFloor ? (
              <p className="p-4 text-gray-500 text-center">Select a floor</p>
            ) : washrooms.length === 0 ? (
              <p className="p-4 text-gray-500 text-center">No washrooms yet</p>
            ) : (
              washrooms.map((washroom) => (
                <div key={washroom.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800">{washroom.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <GenderBadge gender={washroom.gender} />
                        <span className="text-xs text-gray-400">
                          ⭐ {washroom.average_rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setWashroomForm({
                            name: washroom.name,
                            gender: washroom.gender
                          });
                          setEditingItem(washroom);
                          setShowWashroomModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-primary-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWashroom(washroom.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-mono">{washroom.qr_code}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit Building' : 'Add Building'}
              </h3>
              <button onClick={() => setShowBuildingModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveBuilding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={buildingForm.code}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                  className="input"
                  placeholder="e.g., AB1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={buildingForm.description}
                  onChange={(e) => setBuildingForm({ ...buildingForm, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowBuildingModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floor Modal */}
      {showFloorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit Floor' : 'Add Floor'}
              </h3>
              <button onClick={() => setShowFloorModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Number *</label>
                <input
                  type="number"
                  value={floorForm.floor_number}
                  onChange={(e) => setFloorForm({ ...floorForm, floor_number: parseInt(e.target.value) })}
                  className="input"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>
                <input
                  type="text"
                  value={floorForm.floor_name}
                  onChange={(e) => setFloorForm({ ...floorForm, floor_name: e.target.value })}
                  className="input"
                  placeholder="e.g., Ground Floor"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowFloorModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Washroom Modal */}
      {showWashroomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit Washroom' : 'Add Washroom'}
              </h3>
              <button onClick={() => setShowWashroomModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSaveWashroom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={washroomForm.name}
                  onChange={(e) => setWashroomForm({ ...washroomForm, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={washroomForm.gender}
                  onChange={(e) => setWashroomForm({ ...washroomForm, gender: e.target.value })}
                  className="input"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWashroomModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
