import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, ArrowRight } from 'lucide-react';
import { washroomsApi } from '../../services/api';

export default function ScanPage() {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qrCode.trim()) {
      setError('Please enter a QR code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await washroomsApi.getByQR(qrCode.trim());
      navigate(`/washroom/${response.data.id}`);
    } catch (error) {
      setError('Washroom not found. Please check the QR code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <QrCode className="w-10 h-10 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Scan QR Code</h1>
        <p className="text-gray-600">
          Enter the code from the washroom QR sticker to quickly access the rating page
        </p>
      </div>

      {/* Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code
            </label>
            <input
              type="text"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="e.g., BU-AB1-F2-M-a1b2c3d4"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              The code is printed below the QR code on the sticker
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              'Searching...'
            ) : (
              <>
                <Search className="w-5 h-5" />
                Find Washroom
              </>
            )}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="card p-6 bg-primary-50 border-primary-100">
        <h3 className="font-semibold text-primary-800 mb-2">How it works:</h3>
        <ol className="text-sm text-primary-700 space-y-2">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</span>
            <span>Look for the QR code sticker near the washroom entrance</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</span>
            <span>Enter the code printed below the QR image</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</span>
            <span>Rate the washroom or report any issues</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
