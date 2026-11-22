import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  Printer, 
  Download, 
  Building2,
  Filter
} from 'lucide-react';
import { washroomsApi, buildingsApi } from '../../services/api';
import { GenderBadge } from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function QRCodesPage() {
  const [washrooms, setWashrooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedWashrooms, setSelectedWashrooms] = useState([]);
  const printRef = useRef();

  const baseUrl = window.location.origin;

  useEffect(() => {
    loadBuildings();
    loadWashrooms();
  }, []);

  useEffect(() => {
    loadWashrooms();
  }, [selectedBuilding]);

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
      
      const response = await washroomsApi.getAll(params);
      setWashrooms(response.data);
    } catch (error) {
      console.error('Error loading washrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id) => {
    setSelectedWashrooms(prev => 
      prev.includes(id) 
        ? prev.filter(w => w !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedWashrooms.length === washrooms.length) {
      setSelectedWashrooms([]);
    } else {
      setSelectedWashrooms(washrooms.map(w => w.id));
    }
  };

  const getQRUrl = (washroom) => {
    return `${baseUrl}/washroom/${washroom.id}`;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>QR Codes - Bennett University Sanitation</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 30px;
            }
            .qr-card {
              border: 2px solid #1e40af;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              page-break-inside: avoid;
            }
            .qr-header {
              background: #1e40af;
              color: white;
              padding: 10px;
              border-radius: 8px 8px 0 0;
              margin: -20px -20px 15px;
            }
            .qr-header h3 {
              margin: 0;
              font-size: 14px;
            }
            .qr-code {
              margin: 15px 0;
            }
            .qr-info {
              font-size: 12px;
              color: #374151;
            }
            .qr-code-text {
              font-family: monospace;
              font-size: 10px;
              color: #6b7280;
              margin-top: 10px;
            }
            @media print {
              .qr-card {
                break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-grid">
            ${selectedWashrooms.map(id => {
              const washroom = washrooms.find(w => w.id === id);
              if (!washroom) return '';
              return `
                <div class="qr-card">
                  <div class="qr-header">
                    <h3>🚻 Bennett University - Rate This Washroom</h3>
                  </div>
                  <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getQRUrl(washroom))}" alt="QR Code" />
                  </div>
                  <div class="qr-info">
                    <strong>${washroom.name}</strong><br/>
                    ${washroom.building_name} • ${washroom.floor_name}
                  </div>
                  <div class="qr-code-text">${washroom.qr_code}</div>
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QR Code Generator</h1>
          <p className="text-gray-500">Generate printable QR codes for washrooms</p>
        </div>
        <button
          onClick={handlePrint}
          disabled={selectedWashrooms.length === 0}
          className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-5 h-5" />
          Print Selected ({selectedWashrooms.length})
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
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
          <button
            onClick={selectAll}
            className="btn-secondary"
          >
            {selectedWashrooms.length === washrooms.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>

      {/* QR Codes Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : washrooms.length === 0 ? (
        <div className="card p-8 text-center">
          <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No washrooms found</p>
        </div>
      ) : (
        <div ref={printRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {washrooms.map((washroom) => (
            <div
              key={washroom.id}
              onClick={() => toggleSelection(washroom.id)}
              className={`card p-6 cursor-pointer transition-all ${
                selectedWashrooms.includes(washroom.id)
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <input
                  type="checkbox"
                  checked={selectedWashrooms.includes(washroom.id)}
                  onChange={() => toggleSelection(washroom.id)}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <GenderBadge gender={washroom.gender} />
              </div>

              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <QRCodeSVG
                    value={getQRUrl(washroom)}
                    size={120}
                    level="M"
                    includeMargin
                  />
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {washroom.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {washroom.building_name} • {washroom.floor_name}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-2">
                  {washroom.qr_code}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
