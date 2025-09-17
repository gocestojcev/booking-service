import React, { useState, useEffect } from 'react';
import { apiService, Hotel } from '../services/api';
import moment from 'moment';
import './CheckOutReport.css';

interface CheckOutData {
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

const CheckOutReport: React.FC = () => {
  const [checkOuts, setCheckOuts] = useState<CheckOutData[]>([]);
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

  const loadCheckOuts = async () => {
    if (!selectedHotel) return;
    
    setLoading(true);
    setError('');
    try {
      // Extract hotel ID from PK (e.g., "HOTEL#loc1" -> "loc1")
      const hotelId = selectedHotel.includes('#') ? selectedHotel.split('#')[1] : selectedHotel;
      console.log('Loading check-outs for hotel:', selectedHotel, 'extracted ID:', hotelId, 'date:', selectedDate);
      // Fetch reservations for the selected hotel and date (using a 1-day range)
      const reservations = await apiService.getReservations(hotelId, selectedDate, selectedDate);
      console.log('Fetched reservations:', reservations);
      
      // Filter reservations that have check-out dates on the selected date
      const checkOutReservations = reservations.filter(reservation => {
        const checkOutDate = moment(reservation.CheckOutDate);
        const targetDate = moment(selectedDate);
        
        return checkOutDate.isSame(targetDate, 'day');
      });

      // Transform to check-out report format
      const checkOutData: CheckOutData[] = checkOutReservations.map(reservation => ({
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

      setCheckOuts(checkOutData);
    } catch (err: any) {
      console.error('Error loading check-outs:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load check-out data: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  useEffect(() => {
    if (selectedHotel) {
      loadCheckOuts();
    }
  }, [selectedDate, selectedHotel]);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
  };

  const handleHotelChange = (value: string) => {
    setSelectedHotel(value);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Guest Name', 'Room Number', 'Check-in Date', 'Check-out Date', 'Status', 'Contact Phone', 'Notes'],
      ...checkOuts.map(checkOut => [
        checkOut.guestName,
        checkOut.roomNumber,
        moment(checkOut.checkInDate).format('YYYY-MM-DD'),
        moment(checkOut.checkOutDate).format('YYYY-MM-DD'),
        checkOut.status,
        checkOut.contactPhone,
        checkOut.notes || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkout-report-${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="checkout-report">
      <div className="report-controls">
        <div className="filters">
          <div className="filter-group">
            <label>
              Hotel:
              <select
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
            </label>
          </div>
          
          <div className="filter-group">
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
          <button onClick={loadCheckOuts} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={exportToCSV} disabled={checkOuts.length === 0}>
            Export CSV
          </button>
          <button onClick={handlePrint} disabled={checkOuts.length === 0}>
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
            {checkOuts.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  {loading ? 'Loading...' : 'No check-outs found for the selected date'}
                </td>
              </tr>
            ) : (
              checkOuts.map((checkOut) => (
                <tr key={checkOut.reservationId}>
                  <td>{checkOut.guestName}</td>
                  <td>{checkOut.roomNumber}</td>
                  <td>{moment(checkOut.checkInDate).format('YYYY-MM-DD')}</td>
                  <td>{moment(checkOut.checkOutDate).format('YYYY-MM-DD')}</td>
                  <td>
                    <span className={`status-badge status-${checkOut.status.toLowerCase()}`}>
                      {checkOut.status}
                    </span>
                  </td>
                  <td>{checkOut.contactPhone}</td>
                  <td>{checkOut.notes || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="report-summary">
        <p>Total Check-outs: {checkOuts.length}</p>
      </div>
    </div>
  );
};

export default CheckOutReport;
