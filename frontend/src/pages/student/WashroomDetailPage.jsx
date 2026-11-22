import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  ArrowLeft, 
  Star, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Send
} from 'lucide-react';
import { washroomsApi, ratingsApi, issuesApi } from '../../services/api';
import StarRating, { RatingDisplay } from '../../components/common/StarRating';
import { GenderBadge, StatusBadge } from '../../components/common/StatusBadge';
import IssueTypeLabel, { getIssueTypeOptions } from '../../components/common/IssueTypeLabel';
import PhotoUpload from '../../components/common/PhotoUpload';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function WashroomDetailPage() {
  const { id } = useParams();
  const [washroom, setWashroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rate');
  
  // Rating form state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [ratingPhoto, setRatingPhoto] = useState(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Issue form state
  const [issueType, setIssueType] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePriority, setIssuePriority] = useState('medium');
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Issues list
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    loadWashroom();
    loadIssues();
  }, [id]);

  const loadWashroom = async () => {
    try {
      const response = await washroomsApi.getById(id);
      setWashroom(response.data);
    } catch (error) {
      console.error('Error loading washroom:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async () => {
    try {
      const response = await issuesApi.getAll({ washroom_id: id, limit: 10 });
      setIssues(response.data.issues);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    setSubmittingRating(true);
    setRatingError('');

    try {
      await ratingsApi.submit({
        washroom_id: id,
        rating,
        feedback: feedback || null,
        photo: ratingPhoto,
      });
      setRatingSuccess(true);
      setRating(0);
      setFeedback('');
      setRatingPhoto(null);
      loadWashroom();
    } catch (error) {
      setRatingError(error.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueType) {
      setIssueError('Please select an issue type');
      return;
    }

    setSubmittingIssue(true);
    setIssueError('');

    try {
      await issuesApi.report({
        washroom_id: id,
        issue_type: issueType,
        description: issueDescription || null,
        priority: issuePriority,
        photo: issuePhoto,
      });
      setIssueSuccess(true);
      setIssueType('');
      setIssueDescription('');
      setIssuePriority('medium');
      setIssuePhoto(null);
      loadIssues();
    } catch (error) {
      setIssueError(error.response?.data?.error || 'Failed to report issue');
    } finally {
      setSubmittingIssue(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading washroom..." />;
  }

  if (!washroom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Washroom not found</p>
        <Link to="/" className="text-primary-600 hover:underline mt-2 inline-block">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Directory
      </Link>

      {/* Washroom Info Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">{washroom.name}</h1>
              <GenderBadge gender={washroom.gender} />
            </div>
            <p className="text-gray-500 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {washroom.building_name} • {washroom.floor_name}
            </p>
          </div>
          <div className="text-right">
            <RatingDisplay
              rating={washroom.average_rating}
              totalRatings={washroom.total_ratings}
              size="md"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">
              {washroom.average_rating?.toFixed(1) || '0.0'}
            </p>
            <p className="text-sm text-gray-500">Avg Rating</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-secondary-600">
              {washroom.total_ratings || 0}
            </p>
            <p className="text-sm text-gray-500">Total Ratings</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {washroom.issueStats?.open_count || 0}
            </p>
            <p className="text-sm text-gray-500">Open Issues</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('rate')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'rate'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Star className="w-5 h-5 inline mr-2" />
          Rate
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5 inline mr-2" />
          Report Issue
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'issues'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-5 h-5 inline mr-2" />
          Issues ({issues.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="card p-6">
        {activeTab === 'rate' && (
          <div>
            {ratingSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Thank You!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your rating has been submitted successfully.
                </p>
                <button
                  onClick={() => setRatingSuccess(false)}
                  className="btn-primary"
                >
                  Submit Another Rating
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRating} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    How clean is this washroom? *
                  </label>
                  <div className="flex justify-center">
                    <StarRating rating={rating} onRate={setRating} size="xl" />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {rating === 0 && 'Tap to rate'}
                    {rating === 1 && 'Very Poor'}
                    {rating === 2 && 'Poor'}
                    {rating === 3 && 'Average'}
                    {rating === 4 && 'Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Feedback (Optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                    className="input"
                    placeholder="Share your experience..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo (Optional)
                  </label>
                  <PhotoUpload
                    onPhotoSelect={setRatingPhoto}
                    currentPhoto={null}
                  />
                </div>

                {ratingError && (
                  <p className="text-red-600 text-sm">{ratingError}</p>
                )}

                <button
                  type="submit"
                  disabled={submittingRating}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submittingRating ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Rating
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <div>
            {issueSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Issue Reported!
                </h3>
                <p className="text-gray-600 mb-4">
                  Thank you for helping us maintain campus hygiene.
                </p>
                <button
                  onClick={() => setIssueSuccess(false)}
                  className="btn-primary"
                >
                  Report Another Issue
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitIssue} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type *
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select issue type</option>
                    {getIssueTypeOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-4">
                    {['low', 'medium', 'high'].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="priority"
                          value={p}
                          checked={issuePriority === p}
                          onChange={(e) => setIssuePriority(e.target.value)}
                          className="text-primary-600"
                        />
                        <span className="capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    rows={3}
                    className="input"
                    placeholder="Describe the issue..."
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo (Optional)
                  </label>
                  <PhotoUpload
                    onPhotoSelect={setIssuePhoto}
                    currentPhoto={null}
                  />
                </div>

                {issueError && (
                  <p className="text-red-600 text-sm">{issueError}</p>
                )}

                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="btn-danger w-full flex items-center justify-center gap-2"
                >
                  {submittingIssue ? (
                    'Submitting...'
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      Report Issue
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div>
            {issues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">No issues reported for this washroom.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <IssueTypeLabel type={issue.issue_type} />
                      <StatusBadge status={issue.status} />
                    </div>
                    {issue.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {issue.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      Reported {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
