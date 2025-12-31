import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDateTime } from '../../utils/date';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons for check-in (green) and check-out (blue)
const checkInIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const checkOutIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapBounds({ attendanceRecords }) {
  const map = useMap();

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      const bounds = [];
      attendanceRecords.forEach((record) => {
        bounds.push([record.checkInLat, record.checkInLng]);
        if (record.checkOutLat && record.checkOutLng) {
          bounds.push([record.checkOutLat, record.checkOutLng]);
        }
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [attendanceRecords, map]);

  return null;
}

export function AttendanceMap({ attendanceRecords }) {
  // Default center (will be overridden by bounds)
  const defaultCenter = attendanceRecords.length > 0
    ? [attendanceRecords[0].checkInLat, attendanceRecords[0].checkInLng]
    : [20.5937, 78.9629]; // India center as fallback

  if (attendanceRecords.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">No attendance records to display on map</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      className="h-96 w-full rounded-lg z-0"
      style={{ height: '400px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapBounds attendanceRecords={attendanceRecords} />

      {attendanceRecords.map((record) => (
        <div key={record.id}>
          {/* Check-in marker */}
          <Marker
            position={[record.checkInLat, record.checkInLng]}
            icon={checkInIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold text-green-600 mb-1">Check In</p>
                <p className="font-medium">
                  {record.user?.firstName} {record.user?.lastName}
                </p>
                <p className="text-gray-500">{formatDateTime(record.checkInTime)}</p>
                <p className="text-gray-400 text-xs mt-1">{record.checkInAddress}</p>
              </div>
            </Popup>
          </Marker>

          {/* Check-out marker */}
          {record.checkOutLat && record.checkOutLng && (
            <Marker
              position={[record.checkOutLat, record.checkOutLng]}
              icon={checkOutIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold text-blue-600 mb-1">Check Out</p>
                  <p className="font-medium">
                    {record.user?.firstName} {record.user?.lastName}
                  </p>
                  <p className="text-gray-500">{formatDateTime(record.checkOutTime)}</p>
                  <p className="text-gray-400 text-xs mt-1">{record.checkOutAddress}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </div>
      ))}
    </MapContainer>
  );
}
