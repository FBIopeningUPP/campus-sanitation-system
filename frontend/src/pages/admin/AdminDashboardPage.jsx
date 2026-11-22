import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  AlertCircle, 
  Star, 
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import IssueTypeLabel from '../../components/common/IssueTypeLabel';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await adminApi.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  if (!data) {
    return <div className="text-center text-gray-500">Failed to load dashboard</div>;
  }

  const { summary, recentIssues, topWashrooms, lowestWashrooms } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Overview of campus sanitation system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{summary.totalBuildings}</p>
              <p className="text-sm text-gray-500">Buildings</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-secondary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{summary.totalWashrooms}</p>
              <p className="text-sm text-gray-500">Washrooms</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{summary.totalRatings}</p>
              <p className="text-sm text-gray-500">Ratings</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{summary.openIssues}</p>
              <p className="text-sm text-gray-500">Open Issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Status Breakdown */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Issue Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{summary.openIssues}</p>
            <p className="text-sm text-red-700">Open</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-600">{summary.inProgressIssues}</p>
            <p className="text-sm text-yellow-700">In Progress</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{summary.resolvedIssues}</p>
            <p className="text-sm text-green-700">Resolved</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Issues */}
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Recent Issues</h2>
            <Link
              to="/admin/issues"
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y">
            {recentIssues.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No recent issues</div>
            ) : (
              recentIssues.map((issue) => (
                <div key={issue.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <IssueTypeLabel type={issue.issue_type} />
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {issue.washroom_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top & Lowest Washrooms */}
        <div className="space-y-6">
          {/* Top Washrooms */}
          <div className="card">
            <div className="p-4 border-b flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h2 className="font-semibold text-gray-800">Top Rated</h2>
            </div>
            <div className="divide-y">
              {topWashrooms.slice(0, 3).map((washroom, index) => (
                <div key={washroom.id} className="p-4 flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{washroom.name}</p>
                    <p className="text-sm text-gray-500">{washroom.building_name}</p>
                  </div>
                  <span className="text-green-600 font-semibold">
                    ⭐ {washroom.average_rating?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="card">
            <div className="p-4 border-b flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-gray-800">Needs Attention</h2>
            </div>
            <div className="divide-y">
              {lowestWashrooms.slice(0, 3).map((washroom, index) => (
                <div key={washroom.id} className="p-4 flex items-center gap-3">
                  <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{washroom.name}</p>
                    <p className="text-sm text-gray-500">{washroom.building_name}</p>
                  </div>
                  <span className="text-red-600 font-semibold">
                    ⭐ {washroom.average_rating?.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
