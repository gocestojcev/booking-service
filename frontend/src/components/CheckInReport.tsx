import React, { useState, useEffect } from 'react';
import { apiService, Hotel } from '../services/api';
import moment from 'moment';
import './CheckInReport.css';

interface CheckInData {
  reservationId: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
}

const CheckInReport: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckInData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [hotels, setHotels] = useState<Hotel[]>([]);

  const loadHotels = async () => {
    try {
      const hotelsData = await apiService.getHotels();
      setHotels(hotelsData);
      if (hotelsData.length > 0 && !selectedHotel) {
        setSelectedHotel(hotelsData[0].PK);
      }
    } catch (err) {
      console.error('Error loading hotels:', err);
    }
  };

  const loadCheckIns = async () => {
    if (!selectedHotel) return;
    
    setLoading(true);
    setError('');
    try {
      // Extract hotel ID from PK (e.g., "HOTEL#loc1" -> "loc1")
      const hotelId = selectedHotel.includes('#') ? selectedHotel.split('#')[1] : selectedHotel;
      console.log('Loading check-ins for hotel:', selectedHotel, 'extracted ID:', hotelId, 'date:', selectedDate);
      // Fetch reservations for the selected hotel and date (using a 1-day range)
      const reservations = await apiService.getReservations(hotelId, selectedDate, selectedDate);
      console.log('Fetched reservations:', reservations);
      
      // Filter reservations that have check-in dates on the selected date
      const checkInReservations = reservations.filter(reservation => {
        const checkInDate = moment(reservation.CheckInDate);
        const targetDate = moment(selectedDate);
        
        return checkInDate.isSame(targetDate, 'day');
      });

      // Transform to check-in report format
      const checkInData: CheckInData[] = checkInReservations.map(reservation => ({
        reservationId: reservation.PK,
        guestName: `${reservation.ContactName} ${reservation.ContactLastName}`,
        roomNumber: reservation.RoomId,
        checkInDate: reservation.CheckInDate,
        checkOutDate: reservation.CheckOutDate,
        status: reservation.Status,
        contactName: reservation.ContactName,
        contactPhone: reservation.ContactPhone || '',
        notes: reservation.Notes || ''
      }))
      .sort((a, b) => {
        const nameA = a.guestName.toLowerCase();
        const nameB = b.guestName.toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setCheckIns(checkInData);
    } catch (err: any) {
      console.error('Error loading check-ins:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load check-in data: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    setCheckIns([]); // Clear data when filter changes
  };

  const handleHotelChange = (value: string) => {
    setSelectedHotel(value);
    setCheckIns([]); // Clear data when filter changes
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Guest Name', 'Room Number', 'Check-in Date', 'Check-out Date', 'Status', 'Contact Phone', 'Notes'],
      ...checkIns.map(checkIn => [
        checkIn.guestName,
        checkIn.roomNumber,
        moment(checkIn.checkInDate).format('YYYY-MM-DD'),
        moment(checkIn.checkOutDate).format('YYYY-MM-DD'),
        checkIn.status,
        checkIn.contactPhone,
        checkIn.notes || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-report-${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="checkin-report">
      <div className="report-controls">
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="hotel-select">Hotel:</label>
            <select
              id="hotel-select"
              value={selectedHotel}
              onChange={(e) => handleHotelChange(e.target.value)}
              disabled={hotels.length === 0}
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
            <label>
              Date:
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="report-actions">
          <button onClick={loadCheckIns} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={exportToCSV} disabled={checkIns.length === 0}>
            Export CSV
          </button>
          <button onClick={handlePrint} disabled={checkIns.length === 0}>
            Print
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Room Number</th>
              <th>Check-in Date</th>
              <th>Check-out Date</th>
              <th>Status</th>
              <th>Contact Phone</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {checkIns.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {loading ? 'Loading...' : 'No check-ins found for the selected date'}
                </td>
              </tr>
            ) : (
              checkIns.map((checkIn) => (
                <tr key={checkIn.reservationId}>
                  <td>{checkIn.guestName}</td>
                  <td>{checkIn.roomNumber}</td>
                  <td>{moment(checkIn.checkInDate).format('YYYY-MM-DD')}</td>
                  <td>{moment(checkIn.checkOutDate).format('YYYY-MM-DD')}</td>
                  <td>
                    <span className={`status-badge status-${checkIn.status.toLowerCase()}`}>
                      {checkIn.status}
                    </span>
                  </td>
                  <td>{checkIn.contactPhone}</td>
                  <td>{checkIn.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="report-summary">
        <p>Total Check-ins: {checkIns.length}</p>
      </div>
    </div>
  );
};

export default CheckInReport;
