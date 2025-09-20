import React, { useState, useEffect } from 'react';
import { apiService, Hotel, ReservationResponse } from '../services/api';
import './DeletedReservationsReport.css';

const DeletedReservationsReport: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [deletedReservations, setDeletedReservations] = useState<ReservationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadHotels();
    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadHotels = async () => {
    try {
      const hotelsData = await apiService.getHotels();
      setHotels(hotelsData);
      if (hotelsData.length > 0) {
        setSelectedHotel(hotelsData[0].PK);
      }
    } catch (err) {
      console.error('Error loading hotels:', err);
      setError('Failed to load hotels');
    }
  };

  const handleHotelChange = (value: string) => {
    setSelectedHotel(value);
    setDeletedReservations([]); // Clear data when filter changes
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDeletedReservations([]); // Clear data when filter changes
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setDeletedReservations([]); // Clear data when filter changes
  };

  const loadDeletedReservations = async () => {
    if (!selectedHotel || !startDate || !endDate) {
      setError('Please select a hotel and date range');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Extract hotel ID from PK (e.g., "LOCATION#loc1" -> "loc1")
      const hotelId = selectedHotel.includes('#') ? selectedHotel.split('#')[1] : selectedHotel;
      console.log('🔍 Loading deleted reservations for hotel:', hotelId, 'from', startDate, 'to', endDate);
      const reservations = await apiService.getDeletedReservations(hotelId, startDate, endDate);
      console.log('📋 Deleted reservations loaded:', reservations);
      setDeletedReservations(reservations || []);
    } catch (err) {
      console.error('❌ Error loading deleted reservations:', err);
      setError('Failed to load deleted reservations');
      setDeletedReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="deleted-reservations-report">
      <div className="report-controls">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="hotel-select">Hotel:</label>
            <select
              id="hotel-select"
              value={selectedHotel}
              onChange={(e) => handleHotelChange(e.target.value)}
            >
              <option value="">Select Hotel</option>
              {hotels.map((hotel) => (
                <option key={hotel.PK} value={hotel.PK}>
                  {hotel.Name}
                </option>
              ))}
            </select>
          </div>

          <div className="date-range">
            <label htmlFor="start-date">
              Start Date:
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </label>
            <label htmlFor="end-date">
              End Date:
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="report-actions">
          <button
            onClick={loadDeletedReservations}
            disabled={loading || !selectedHotel || !startDate || !endDate}
          >
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Room</th>
              <th>Guest Name</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Deleted On</th>
              <th>Deleted By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="no-data">
                  Loading deleted reservations...
                </td>
              </tr>
            ) : (!deletedReservations || deletedReservations.length === 0) ? (
              <tr>
                <td colSpan={8} className="no-data">
                  No deleted reservations found for the selected period.
                </td>
              </tr>
            ) : (
              deletedReservations.map((reservation) => (
                <tr key={reservation.PK}>
                  <td>{reservation.RoomId}</td>
                  <td>
                    {reservation.ContactName} {reservation.ContactLastName}
                  </td>
                  <td>{formatDate(reservation.CheckInDate)}</td>
                  <td>{formatDate(reservation.CheckOutDate)}</td>
                  <td>
                    <span className={`status-badge status-${reservation.Status.toLowerCase()}`}>
                      {reservation.Status}
                    </span>
                  </td>
                  <td>{reservation.DeletedOn ? formatDateTime(reservation.DeletedOn) : 'N/A'}</td>
                  <td>{reservation.DeletedBy || 'N/A'}</td>
                  <td>{reservation.Notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {deletedReservations && deletedReservations.length > 0 && (
        <div className="report-summary">
          Total deleted reservations: {deletedReservations.length}
        </div>
      )}
    </div>
  );
};

export default DeletedReservationsReport;
