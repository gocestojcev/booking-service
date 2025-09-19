import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { Room, Reservation, Guest } from '../services/api';
import { apiService } from '../services/api';
import './ReservationModal.css';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  event: any;
  rooms: Room[];
  hotelId: string;
}

const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  rooms,
  hotelId,
}) => {
  const [formData, setFormData] = useState<Reservation>({
    reservation_id: '',
    room_number: '',
    check_in_date: '',
    check_out_date: '',
    status: 'Confirmed',
    contact_name: '',
    contact_last_name: '',
    contact_phone: '',
    notes: '',
    guests: [],
  });

  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadReservationDetails = useCallback(async (reservationId: string) => {
    console.log('Loading reservation details for ID:', reservationId);
    console.log('Event data:', event);
    console.log('Event reservation:', event.reservation);
    
    // Use reservation data from the event if available
    if (event.reservation) {
      console.log('Using event reservation data:', event.reservation);
      setFormData({
        reservation_id: reservationId,
        room_number: event.resource.roomNumber,
        check_in_date: event.reservation.CheckInDate,
        check_out_date: event.reservation.CheckOutDate,
        status: event.reservation.Status,
        contact_name: event.reservation.ContactName,
        contact_last_name: event.reservation.ContactLastName,
        contact_phone: event.reservation.ContactPhone || '',
        notes: event.reservation.Notes || '',
        guests: event.reservation.Guests || [],
      });
      setGuests(event.reservation.Guests || []);
    } else {
      // Fallback to basic data if reservation details not available
      setFormData({
        reservation_id: reservationId,
        room_number: event.resource.roomNumber,
        check_in_date: event.start.toISOString().split('T')[0],
        check_out_date: event.end.toISOString().split('T')[0],
        status: event.resource.status,
        contact_name: '',
        contact_last_name: '',
        contact_phone: '',
        notes: '',
        guests: [],
      });
    }
  }, [event]);

  useEffect(() => {
    // Clear error state when modal opens or event changes
    setError('');
    
    if (event) {
      if (event.id === 'new') {
        // New reservation
        setFormData({
          reservation_id: '',
          room_number: event.resource?.roomNumber || (rooms.length > 0 ? rooms[0].Number : ''),
          check_in_date: event.start.toISOString().split('T')[0],
          check_out_date: event.end.toISOString().split('T')[0],
          status: 'Confirmed',
          contact_name: '',
          contact_last_name: '',
          contact_phone: '',
          notes: '',
          guests: [],
        });
        setGuests([]);
      } else {
        // Edit existing reservation
        loadReservationDetails(event.resource.reservationId);
      }
    }
  }, [event, rooms, loadReservationDetails]);

  // Clear error when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setError('');
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddGuest = () => {
    setGuests(prev => [...prev, { first_name: '', last_name: '' }]);
  };

  const handleGuestChange = (index: number, field: keyof Guest, value: string) => {
    setGuests(prev => prev.map((guest, i) => 
      i === index ? { ...guest, [field]: value } : guest
    ));
  };

  const handleRemoveGuest = (index: number) => {
    setGuests(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reservationData: Reservation = {
        ...formData,
        guests: guests.filter(guest => guest.first_name.trim() !== '' || guest.last_name.trim() !== ''),
      };

      console.log('Event ID:', event.id);
      console.log('Event resource:', event.resource);
      console.log('Event resource reservationId:', event.resource?.reservationId);
      
      if (event.id === 'new') {
        // Generate a unique reservation ID
        reservationData.reservation_id = `res_${Date.now()}`;
        console.log('Creating reservation with data:', reservationData);
        await apiService.createReservation(hotelId, reservationData);
      } else {
        // Remove reservation_id from payload for updates since it's in the URL
        const { reservation_id, ...updateData } = reservationData;
        console.log('Updating reservation with ID:', event.resource.reservationId);
        console.log('Update data:', updateData);
        console.log('Hotel ID:', hotelId);
        await apiService.updateReservation(hotelId, event.resource.reservationId, updateData);
      }

      onSave();
    } catch (err: any) {
      // Handle validation errors from the backend
      if (err.response?.status === 400) {
        setError(err.response.data.detail || 'Validation error. Please check your input.');
      } else {
        setError('Failed to save reservation. Please try again.');
      }
      console.error('Error saving reservation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!event || event.id === 'new') return;

    if (window.confirm('Are you sure you want to delete this reservation?')) {
      setLoading(true);
      try {
        // This would need to be implemented in the API
        // await apiService.deleteReservation(hotelId, event.resource.reservationId);
        onSave();
      } catch (err) {
        setError('Failed to delete reservation. Please try again.');
        console.error('Error deleting reservation:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="reservation-modal"
      overlayClassName="reservation-modal-overlay"
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>{event?.id === 'new' ? 'New Reservation' : 'Edit Reservation'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="reservation-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="room_number">Room:</label>
            <select
              id="room_number"
              name="room_number"
              value={formData.room_number}
              onChange={handleInputChange}
              required
            >
              {rooms.map((room) => (
                <option key={room.Number} value={room.Number}>
                  Room {room.Number} - {room.Type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="check_in_date">Check-in Date:</label>
              <input
                type="date"
                id="check_in_date"
                name="check_in_date"
                value={formData.check_in_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="check_out_date">Check-out Date:</label>
              <input
                type="date"
                id="check_out_date"
                name="check_out_date"
                value={formData.check_out_date}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_name">Contact First Name:</label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_last_name">Contact Last Name:</label>
              <input
                type="text"
                id="contact_last_name"
                name="contact_last_name"
                value={formData.contact_last_name}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contact_phone">Contact Phone:</label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes or special requests..."
              />
            </div>
          </div>

          <div className="guests-section">
            <div className="guests-header">
              <h3>Guests</h3>
              <button type="button" onClick={handleAddGuest} className="add-guest-btn">
                Add Guest
              </button>
            </div>

            {guests.map((guest, index) => (
              <div key={index} className="guest-row">
                <input
                  type="text"
                  placeholder="First Name"
                  value={guest.first_name}
                  onChange={(e) => handleGuestChange(index, 'first_name', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={guest.last_name}
                  onChange={(e) => handleGuestChange(index, 'last_name', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGuest(index)}
                  className="remove-guest-btn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            {event?.id !== 'new' && (
              <button
                type="button"
                onClick={handleDelete}
                className="delete-btn"
                disabled={loading}
              >
                Delete
              </button>
            )}
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReservationModal;
