import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Filter, MapPin, Clock, CheckCircle } from 'lucide-react';
import { issuesApi, buildingsApi } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import IssueTypeLabel from '../../components/common/IssueTypeLabel';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function IssueTrackerPage() {
  const [issues, setIssues] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadBuildings();
  }, []);

  useEffect(() => {
    loadIssues();
  }, [selectedBuilding, selectedStatus]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const loadIssues = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBuilding) params.building_id = selectedBuilding;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await issuesApi.getAll(params);
      setIssues(response.data.issues);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 md:p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-8 h-8" />
          <h1 className="text-2xl md:text-3xl font-bold">Issue Tracker</h1>
        </div>
        <p className="text-red-100">
          Track the status of reported washroom issues across campus
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Building
            </label>
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
          <div className="md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {issues.filter(i => i.status === 'open').length}
          </p>
          <p className="text-sm text-gray-500">Open</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {issues.filter(i => i.status === 'in_progress').length}
          </p>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {issues.filter(i => i.status === 'resolved').length}
          </p>
          <p className="text-sm text-gray-500">Resolved</p>
        </div>
      </div>

      {/* Issues List */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {loading ? 'Loading...' : `${total} Issues Found`}
        </h2>

        {loading ? (
          <LoadingSpinner />
        ) : issues.length === 0 ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No issues found. Great job keeping things clean!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue.id} className="card p-4">
                <div className="flex items-start gap-3">
                  {getStatusIcon(issue.status)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <IssueTypeLabel type={issue.issue_type} />
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    
                    <Link
                      to={`/washroom/${issue.washroom_id}`}
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1 mb-1"
                    >
                      <MapPin className="w-4 h-4" />
                      {issue.washroom_name} • {issue.building_name}
                    </Link>
                    
                    {issue.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {issue.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Reported {formatDate(issue.created_at)}</span>
                      {issue.resolved_at && (
                        <span>Resolved {formatDate(issue.resolved_at)}</span>
                      )}
                    </div>
                  </div>

                  {issue.photo_url && (
                    <img
                      src={`http://localhost:3000${issue.photo_url}`}
                      alt="Issue"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
