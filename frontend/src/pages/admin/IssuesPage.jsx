import { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Filter, 
  MapPin, 
  Clock,
  Download
} from 'lucide-react';
import { issuesApi, buildingsApi, adminApi } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../../components/common/StatusBadge';
import IssueTypeLabel from '../../components/common/IssueTypeLabel';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadBuildings();
    loadIssues();
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
      const params = { limit: 100 };
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

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      await issuesApi.updateStatus(issueId, newStatus);
      loadIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (issueId, newPriority) => {
    try {
      await issuesApi.updatePriority(issueId, newPriority);
      loadIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update priority');
    }
  };

  const handleDelete = async (issueId) => {
    if (!confirm('Delete this issue?')) return;
    try {
      await issuesApi.delete(issueId);
      loadIssues();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete issue');
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (selectedBuilding) params.building_id = selectedBuilding;
      if (selectedStatus) params.status = selectedStatus;
      
      const response = await adminApi.exportIssues(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'issues-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export issues');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Issues</h1>
          <p className="text-gray-500">View and resolve reported issues</p>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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

      {/* Issues Table */}
      {loading ? (
        <LoadingSpinner />
      ) : issues.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No issues found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <IssueTypeLabel type={issue.issue_type} />
                      {issue.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {issue.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{issue.washroom_name}</p>
                      <p className="text-xs text-gray-500">{issue.building_name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded border-0 cursor-pointer ${
                          issue.status === 'open' ? 'bg-red-100 text-red-800' :
                          issue.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={issue.priority}
                        onChange={(e) => handlePriorityChange(issue.id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded border-0 cursor-pointer ${
                          issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(issue.created_at)}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
