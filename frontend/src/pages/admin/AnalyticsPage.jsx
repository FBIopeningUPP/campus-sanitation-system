import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Download,
  Building2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { analyticsApi, buildingsApi, adminApi } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [days, setDays] = useState(30);
  
  const [ratingsTrend, setRatingsTrend] = useState([]);
  const [issuesTrend, setIssuesTrend] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [buildingStats, setBuildingStats] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [responseTime, setResponseTime] = useState(null);

  useEffect(() => {
    loadBuildings();
    loadAllData();
  }, []);

  useEffect(() => {
    loadAllData();
  }, [selectedBuilding, days]);

  const loadBuildings = async () => {
    try {
      const response = await buildingsApi.getAll();
      setBuildings(response.data);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const params = { days };
      if (selectedBuilding) params.building_id = selectedBuilding;
      
      const [
        ratingsTrendRes,
        issuesTrendRes,
        issueTypesRes,
        buildingStatsRes,
        ratingDistRes,
        responseTimeRes
      ] = await Promise.all([
        analyticsApi.getRatingsTrend(params),
        analyticsApi.getIssuesTrend(params),
        analyticsApi.getIssueTypes(params),
        analyticsApi.getBuildingStats(),
        analyticsApi.getRatingDistribution(params),
        analyticsApi.getResponseTime()
      ]);
      
      setRatingsTrend(ratingsTrendRes.data);
      setIssuesTrend(issuesTrendRes.data);
      setIssueTypes(issueTypesRes.data);
      setBuildingStats(buildingStatsRes.data);
      setRatingDistribution(ratingDistRes.data);
      setResponseTime(responseTimeRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportRatings = async () => {
    try {
      const params = {};
      if (selectedBuilding) params.building_id = selectedBuilding;
      
      const response = await adminApi.exportRatings(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ratings-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export ratings');
    }
  };

  const issueTypeLabels = {
    dirty_toilet: 'Dirty Toilet',
    missing_soap: 'Missing Soap',
    water_shortage: 'Water Shortage',
    broken_fixture: 'Broken Fixture',
    bad_odor: 'Bad Odor',
    no_water: 'No Water',
    electrical: 'Electrical',
    other: 'Other'
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
          <p className="text-gray-500">Insights and trends for campus sanitation</p>
        </div>
        <button onClick={handleExportRatings} className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Ratings
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="input"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Response Time Card */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-gray-500">Avg Response Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {responseTime?.averageResponseHours?.toFixed(1) || 0}h
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Total Ratings ({days}d)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {ratingsTrend.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">Issues Reported ({days}d)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {issuesTrend.reduce((sum, d) => sum + d.reported, 0)}
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">Active Buildings</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {buildingStats.length}
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ratings Trend */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Ratings Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  name="Ratings"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="avg_rating" 
                  stroke="#10b981" 
                  name="Avg Rating"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues Trend */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Issues Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issuesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="reported" fill="#ef4444" name="Reported" />
                <Bar dataKey="resolved" fill="#10b981" name="Resolved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Issue Types Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Issue Types Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueTypes.map(i => ({
                    ...i,
                    name: issueTypeLabels[i.issue_type] || i.issue_type
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                >
                  {issueTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Rating Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="rating" 
                  tickFormatter={(v) => `${v}★`}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(v) => `${v} Stars`}
                />
                <Bar dataKey="count" fill="#f59e0b" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Building Stats Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Building Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Washrooms</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Ratings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {buildingStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-800">{stat.name}</p>
                    <p className="text-xs text-gray-500">{stat.code}</p>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{stat.washroom_count}</td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${
                      stat.avg_rating >= 4 ? 'text-green-600' :
                      stat.avg_rating >= 3 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {stat.avg_rating?.toFixed(1) || '0.0'} ★
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{stat.total_ratings || 0}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stat.open_issues > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {stat.open_issues || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
