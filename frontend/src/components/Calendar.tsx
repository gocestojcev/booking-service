import React, { useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment';
import { apiService, Hotel, Room, ReservationResponse } from '../services/api';
import { userContext } from '../services/userContext';
import { companyContext } from '../services/companyContext';
import ReservationModal from './ReservationModal';
import './Calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    roomId: string;
    roomNumber: string;
    reservationId: string;
    status: string;
  };
  reservation?: {
    ContactName: string;
    ContactLastName: string;
    CheckInDate: string;
    CheckOutDate: string;
    Status: string;
    Guests: any[];
  };
}

interface RoomStatus {
  roomId: string;
  roomNumber: string;
  status: 'available' | 'booked' | 'maintenance';
  reservationId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  isCheckInDay?: boolean;
  isCheckOutDay?: boolean;
  isTransitionDay?: boolean;
  checkOutReservationId?: string;
  checkInReservationId?: string;
}

// Utility function to extract reservation ID from DynamoDB PK
const extractReservationId = (pk: string): string => {
  return pk.replace('RESERVATION#', '');
};

interface CalendarComponentProps {
  selectedHotel: string;
  onHotelChange: (hotelId: string) => void;
  hotels: Hotel[];
}

const CalendarComponent: React.FC<CalendarComponentProps> = ({ selectedHotel, onHotelChange, hotels }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [hoveredCell, setHoveredCell] = useState<{roomId: string, date: Date} | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    console.log('Loading data...');
    try {
      const currentUser = userContext.getCurrentUser();
      if (!currentUser || !currentUser.id) {
        console.log('No user found, skipping data load');
        return;
      }

      console.log('Loading company for user:', currentUser.id);
      const companyData = await apiService.getCompany(currentUser.companyId);
      console.log('Loaded company:', companyData);
      companyContext.setCurrentCompany(companyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async (hotelId: string) => {
    if (!hotelId) return;
    
    try {
      console.log('Loading rooms for hotel:', hotelId);
      const roomsData = await apiService.getRooms(hotelId);
      console.log('Loaded rooms:', roomsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }, []);

  const loadReservations = useCallback(async () => {
    if (!selectedHotel) return;        

    try {
      const startDate = moment(selectedDate).startOf('month').format('YYYY-MM-DD');     
      const endDate = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
      console.log('🔄 Loading reservations for hotel:', selectedHotel, 'from', startDate, 'to', endDate);
      
      const reservationsData = await apiService.getReservations(selectedHotel, startDate, endDate);
      console.log('📋 Loaded reservations:', reservationsData.length, 'reservations');
      console.log('📋 Reservation details:', reservationsData.map(r => ({ 
        id: r.PK, 
        room: r.RoomId, 
        isDeleted: r.IsDeleted,
        deletedBy: r.DeletedBy,
        deletedOn: r.DeletedOn
      })));
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  }, [selectedHotel, selectedDate]);

  useEffect(() => {
    console.log('Calendar useEffect - loading data...');
    loadData();
  }, [loadData]);

  // Check if user context is properly set and reload data
  useEffect(() => {
    const checkUserAndLoad = () => {
      const currentUser = userContext.getCurrentUser();
      console.log('Checking user context:', currentUser);
      if (currentUser && currentUser.id !== 'user1') {
        console.log('Real user detected, reloading data...');
        loadData();
      }
    };
    
    // Check immediately
    checkUserAndLoad();
    
    // Also check after a delay to catch user context updates
    const timeoutId = setTimeout(checkUserAndLoad, 500);
    
    return () => clearTimeout(timeoutId);
  }, [loadData]);

  const calculateDaysToShow = useCallback(() => {
    if (!calendarGridRef.current) return 7; // Default fallback
    
    const calendarWidth = calendarGridRef.current.offsetWidth;
    const roomListWidth = 250; // Fixed width of room list from CSS
    const availableWidth = calendarWidth - roomListWidth;
    const cellMinWidth = 80; // From CSS min-width: 80px
    const maxDays = Math.floor(availableWidth / cellMinWidth);
    
    // Ensure we show at least 1 day and at most 30 days
    return Math.max(1, Math.min(maxDays, 30));
  }, []);

  const generateDateRange = useCallback(() => {
    const daysToShow = calculateDaysToShow();
    const dates: Date[] = [];
    const startDate = moment(selectedDate);
    const endDate = moment(selectedDate).add(daysToShow - 1, 'days');
    
    let current = startDate.clone();
    while (current.isSameOrBefore(endDate, 'day')) {
      dates.push(current.toDate());
      current.add(1, 'day');
    }
    
    setDateRange(dates);
  }, [selectedDate, calculateDaysToShow]);

  useEffect(() => {
    if (selectedHotel) {
      loadRooms(selectedHotel);
    }
  }, [selectedHotel, loadRooms]);

  useEffect(() => {
    if (selectedHotel && rooms.length > 0) {
      loadReservations();
      generateDateRange();
    }
  }, [selectedHotel, rooms, selectedDate, generateDateRange, loadReservations]);

  // Add resize listener to recalculate date range when window size changes
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (selectedHotel && rooms.length > 0) {
          generateDateRange();
        }
      }, 100); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [selectedHotel, rooms, generateDateRange]);





  const getRoomStatusForDate = (roomId: string, date: Date): RoomStatus => {
    // Convert the date to a string in YYYY-MM-DD format for comparison
    const dateStr = moment(date).format('YYYY-MM-DD');
    
    // Debug logging
    if (roomId === '101' && dateStr === '2025-09-05') {
      console.log('Debug getRoomStatusForDate:', {
        roomId,
        dateStr,
        reservations: reservations.length,
        reservationsForRoom: reservations.filter(res => res.RoomId === roomId)
      });
    }
    
    // Find all reservations for this room and date
    const matchingReservations = reservations.filter(res => {
      if (res.RoomId !== roomId) return false;
      
      // Compare dates as strings to avoid timezone issues
      return res.CheckInDate <= dateStr && res.CheckOutDate >= dateStr;
    });

    if (matchingReservations.length > 0) {
      // If multiple reservations, check if it's a valid check-out/check-in transition
      if (matchingReservations.length > 1) {
        // Check if one reservation ends and another starts on this date
        const checkOutReservation = matchingReservations.find(res => res.CheckOutDate === dateStr);
        const checkInReservation = matchingReservations.find(res => res.CheckInDate === dateStr);
        
        if (checkOutReservation && checkInReservation) {
          // Valid transition day - show both reservations
          return {
            roomId,
            roomNumber: roomId,
            status: 'booked',
            reservationId: 'TRANSITION',
            guestName: `${checkOutReservation.ContactName} → ${checkInReservation.ContactName}`,
            checkIn: checkInReservation.CheckInDate,
            checkOut: checkOutReservation.CheckOutDate,
            isCheckInDay: true, // Show as check-in day for the new reservation
            isCheckOutDay: true, // Show as check-out day for the ending reservation
            isTransitionDay: true, // Special flag for transition day
            checkOutReservationId: extractReservationId(checkOutReservation.PK), // ID of the ending reservation
            checkInReservationId: extractReservationId(checkInReservation.PK), // ID of the starting reservation
          };
        } else {
          // Actual conflict - overlapping reservations
          return {
            roomId,
            roomNumber: roomId,
            status: 'maintenance', // Use maintenance status for conflicts
            reservationId: 'CONFLICT',
            guestName: `CONFLICT (${matchingReservations.length})`,
            checkIn: '',
            checkOut: '',
            isCheckInDay: false,
            isCheckOutDay: false,
          };
        }
      }
      
      // Single reservation
      const reservation = matchingReservations[0];
      const isCheckInDay = reservation.CheckInDate === dateStr;
      const isCheckOutDay = reservation.CheckOutDate === dateStr;
      
      return {
        roomId,
        roomNumber: roomId,
        status: 'booked',
        reservationId: extractReservationId(reservation.PK),
        guestName: reservation.ContactName,
        checkIn: reservation.CheckInDate,
        checkOut: reservation.CheckOutDate,
        isCheckInDay,
        isCheckOutDay,
      };
    }

    return {
      roomId,
      roomNumber: roomId,
      status: 'available',
    };
  };

  const handleRoomClick = (roomId: string, date: Date) => {
    const roomStatus = getRoomStatusForDate(roomId, date);
    console.log('Room clicked:', roomId, date, 'Status:', roomStatus);
    console.log('Is check-in day:', roomStatus.isCheckInDay);
    console.log('Is check-out day:', roomStatus.isCheckOutDay);
    
    if (roomStatus.status === 'booked') {
      // Handle transition days specially
      if (roomStatus.reservationId === 'TRANSITION') {
        console.log('Transition day clicked - need to find the appropriate reservation');
        // For transition days, we need to find the reservation that matches the clicked date
        const dateStr = moment(date).format('YYYY-MM-DD');
        const matchingReservations = reservations.filter(res => 
          res.RoomId === roomId && 
          (res.CheckInDate === dateStr || res.CheckOutDate === dateStr)
        );
        
        if (matchingReservations.length > 0) {
          // Use the first matching reservation (could be improved to show a selection)
          const reservation = matchingReservations[0];
          console.log('Using first matching reservation for transition day:', reservation);
          const event: CalendarEvent = {
            id: reservation.PK,
            title: `Room ${roomId} - ${reservation.ContactName}`,
            start: new Date(reservation.CheckInDate),
            end: new Date(reservation.CheckOutDate),
            resource: {
              roomId: roomId,
              roomNumber: roomId,
              reservationId: extractReservationId(reservation.PK),
              status: reservation.Status,
            },
            reservation: {
              ContactName: reservation.ContactName,
              ContactLastName: reservation.ContactLastName || '',
              CheckInDate: reservation.CheckInDate,
              CheckOutDate: reservation.CheckOutDate,
              Status: reservation.Status,
              Guests: reservation.Guests || [],
            },
          };
          setSelectedEvent(event);
          setIsModalOpen(true);
          return;
        }
      }
      
      // Edit existing reservation
      console.log('Looking for reservation with ID:', roomStatus.reservationId);
      console.log('Available reservations:', reservations.map(r => ({ PK: r.PK, extracted: extractReservationId(r.PK) })));
      const reservation = reservations.find(res => extractReservationId(res.PK) === roomStatus.reservationId);
      console.log('Found reservation:', reservation);
      if (reservation) {
        console.log('Reservation contact details:', {
          ContactName: reservation.ContactName,
          ContactLastName: reservation.ContactLastName
        });
        const event: CalendarEvent = {
          id: reservation.PK,
          title: `Room ${roomId} - ${reservation.ContactName}`,
          start: new Date(reservation.CheckInDate),
          end: new Date(reservation.CheckOutDate),
          resource: {
            roomId: roomId,
            roomNumber: roomId,
            reservationId: extractReservationId(reservation.PK),
            status: reservation.Status,
          },
          reservation: {
            ContactName: reservation.ContactName,
            ContactLastName: reservation.ContactLastName || '',
            CheckInDate: reservation.CheckInDate,
            CheckOutDate: reservation.CheckOutDate,
            Status: reservation.Status,
            Guests: reservation.Guests || [],
          },
        };
        console.log('Creating edit event:', event);
        console.log('Event ID:', event.id);
        console.log('Event resource reservationId:', event.resource.reservationId);
        setSelectedEvent(event);
        setIsModalOpen(true);
      } else {
        console.error('Reservation not found for ID:', roomStatus.reservationId);
      }
    } else {
      // Create new reservation
      const event: CalendarEvent = {
        id: 'new',
        title: 'New Reservation',
        start: date,
        end: moment(date).add(1, 'day').toDate(),
        resource: {
          roomId: roomId,
          roomNumber: roomId,
          reservationId: '',
          status: 'Draft',
        },
      };
      console.log('Creating new reservation event:', event);
      console.log('Event ID:', event.id);
      console.log('Event resource reservationId:', event.resource.reservationId);
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

  const handleReservationClick = (roomId: string, date: Date, reservationId: string) => {
    console.log('Specific reservation clicked:', roomId, date, 'Reservation ID:', reservationId);
    
    const reservation = reservations.find(res => extractReservationId(res.PK) === reservationId);
    if (reservation) {
      console.log('Found specific reservation:', reservation);
      const event: CalendarEvent = {
        id: reservation.PK,
        title: `Room ${roomId} - ${reservation.ContactName}`,
        start: new Date(reservation.CheckInDate),
        end: new Date(reservation.CheckOutDate),
        resource: {
          roomId: roomId,
          roomNumber: roomId,
          reservationId: extractReservationId(reservation.PK),
          status: reservation.Status,
        },
        reservation: {
          ContactName: reservation.ContactName,
          ContactLastName: reservation.ContactLastName || '',
          CheckInDate: reservation.CheckInDate,
          CheckOutDate: reservation.CheckOutDate,
          Status: reservation.Status,
          Guests: reservation.Guests || [],
        },
      };
      setSelectedEvent(event);
      setIsModalOpen(true);
    } else {
      console.error('Reservation not found for ID:', reservationId);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleReservationSave = () => {
    handleModalClose();
    loadReservations(); // Refresh the calendar
  };

  const handleReservationDelete = async (reservationId: string) => {
    if (!reservationId || reservationId === 'new') {
      console.error('Cannot delete reservation: invalid reservation ID');
      return;
    }

    if (!selectedHotel) {
      console.error('Cannot delete reservation: no hotel selected');
      return;
    }

    try {
      console.log('🗑️ Deleting reservation:', reservationId, 'for hotel:', selectedHotel);
      const response = await apiService.deleteReservation(selectedHotel, reservationId);
      console.log('✅ Reservation deleted successfully:', response);
      handleModalClose();
      console.log('🔄 Refreshing calendar...');
      loadReservations(); // Refresh the calendar
    } catch (error) {
      console.error('❌ Error deleting reservation:', error);
      // You might want to show an error message to the user here
    }
  };


  const getRoomDisplayName = (room: Room) => {
    // Extract floor information from room number
    const roomNumber = parseInt(room.Number);
    let floor = 'приземје';
    let floorNumber = '0';
    
    if (roomNumber >= 100 && roomNumber < 200) {
      floor = 'спрат';
      floorNumber = '1';
    } else if (roomNumber >= 200 && roomNumber < 300) {
      floor = 'спрат';
      floorNumber = '2';
    } else if (roomNumber >= 300 && roomNumber < 400) {
      floor = 'спрат';
      floorNumber = '3';
    } else if (roomNumber >= 400 && roomNumber < 500) {
      floor = 'спрат';
      floorNumber = '4';
    }
    
    return `${room.Number} [${floor} ${floorNumber} - 1/4]`;
  };

  if (isDataLoading) {
    return (
      <div className="room-calendar-container">
        <div className="calendar-header">
        </div>
        <div className="loading-container">
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="room-calendar-container">
      <div className="room-calendar-grid">
        <div className="room-list">
          <div className="room-header">
            <div className="date-navigation">
              <button onClick={() => setSelectedDate(moment(selectedDate).subtract(1, 'day').toDate())}>
                ←
              </button>
              <input
                type="date"
                value={moment(selectedDate).format('YYYY-MM-DD')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="date-picker"
              />
              <button onClick={() => setSelectedDate(moment(selectedDate).add(1, 'day').toDate())}>
                →
              </button>
            </div>
          </div>
          {rooms.map((room) => (
            <div 
              key={room.Number}
              className={`room-item ${selectedRoom === room.Number ? 'selected' : ''} ${
                hoveredCell?.roomId === room.Number ? 'hovered' : ''
              }`}
              onClick={() => setSelectedRoom(room.Number)}
            >
              {getRoomDisplayName(room)}
            </div>
          ))}
        </div>

        <div className="calendar-grid" ref={calendarGridRef}>
          <div className="date-header">
            {dateRange.map((date, index) => (
              <div
                key={index}
                className={`date-cell ${
                  index === 0 ? 'selected' : ''
                } ${
                  hoveredCell && moment(hoveredCell.date).format('YYYY-MM-DD') === moment(date).format('YYYY-MM-DD') ? 'hovered' : ''
                }`}
              >
                {moment(date).format('ddd, MMM Do')}
              </div>
            ))}
          </div>

          {rooms.map((room) => (
            <div key={room.Number} className="room-row">
              {dateRange.map((date, dateIndex) => {
                const roomStatus = getRoomStatusForDate(room.Number, date);
                
                return (
                  <div
                    key={`${room.Number}-${dateIndex}`}
                    className={`room-cell ${roomStatus.status} ${
                      roomStatus.isCheckInDay ? 'check-in-day' : ''
                    } ${
                      roomStatus.isCheckOutDay ? 'check-out-day' : ''
                    }`}
                    onClick={() => handleRoomClick(room.Number, date)}
                    onMouseEnter={() => setHoveredCell({roomId: room.Number, date})}
                    onMouseLeave={() => setHoveredCell(null)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    {roomStatus.status === 'booked' ? (
                      roomStatus.isCheckOutDay && roomStatus.isCheckInDay ? (
                        // Transition day - both check-in and check-out on same day
                        <>
                          <div 
                            className="cell-half left-half booked"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the left half - edit existing reservation ending
                              if (roomStatus.checkOutReservationId) {
                                handleReservationClick(room.Number, date, roomStatus.checkOutReservationId);
                              }
                            }}
                          >
                            <div className="check-out-arrow"></div>
                          </div>
                          <div 
                            className="cell-half right-half booked"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the right half - edit existing reservation starting
                              if (roomStatus.checkInReservationId) {
                                handleReservationClick(room.Number, date, roomStatus.checkInReservationId);
                              }
                            }}
                          >
                            <div className="check-in-arrow"></div>
                          </div>
                        </>
                      ) : roomStatus.isCheckOutDay ? (
                        // Check-out day - split cell with green right half for new reservation
                        <>
                          <div 
                            className="cell-half left-half booked"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the booked half - edit existing reservation
                              handleRoomClick(room.Number, date);
                            }}
                          >
                            <div className="check-out-arrow"></div>
                          </div>
                          <div 
                            className="cell-half right-half available"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the green half - create new reservation starting this day
                              const event: CalendarEvent = {
                                id: 'new',
                                title: 'New Reservation',
                                start: date,
                                end: moment(date).add(1, 'day').toDate(),
                                resource: {
                                  roomId: room.Number,
                                  roomNumber: room.Number,
                                  reservationId: 'new',
                                  status: 'available',
                                },
                              };
                              setSelectedEvent(event);
                              setIsModalOpen(true);
                            }}
                          >
                          </div>
                        </>
                      ) : roomStatus.isCheckInDay ? (
                        // Check-in day - split cell with green left half for new reservation
                        <>
                          <div 
                            className="cell-half left-half available"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the green half - create new reservation ending this day
                              const event: CalendarEvent = {
                                id: 'new',
                                title: 'New Reservation',
                                start: moment(date).subtract(1, 'day').toDate(),
                                end: date,
                                resource: {
                                  roomId: room.Number,
                                  roomNumber: room.Number,
                                  reservationId: 'new',
                                  status: 'available',
                                },
                              };
                              setSelectedEvent(event);
                              setIsModalOpen(true);
                            }}
                          >
                          </div>
                          <div 
                            className="cell-half right-half booked"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Click on the booked half - edit existing reservation
                              handleRoomClick(room.Number, date);
                            }}
                          >
                            <div className="check-in-arrow"></div>
                          </div>
                        </>
                      ) : (
                        // Regular booked day
                        <div className="reservation-bar">
                        </div>
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <ReservationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleReservationSave}
        onDelete={handleReservationDelete}
        event={selectedEvent}
        rooms={rooms}
        hotelId={selectedHotel}
      />
    </div>
  );
};

export default CalendarComponent;