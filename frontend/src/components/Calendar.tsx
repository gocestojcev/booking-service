import React, { useState, useEffect, useRef, useCallback } from 'react';
import moment from 'moment';
import { apiService, Hotel, Room, ReservationResponse, Company } from '../services/api';
import { userContext } from '../services/userContext';
import { companyContext } from '../services/companyContext';
import ReservationModal from './ReservationModal';
import './Calendar.css';
import { debug } from 'console';

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
}

// Utility function to extract reservation ID from DynamoDB PK
const extractReservationId = (pk: string): string => {
  return pk.replace('RESERVATION#', '');
};

const CalendarComponent: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [hoveredCell, setHoveredCell] = useState<{roomId: string, date: Date} | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const calendarGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Calendar useEffect - loading data...');
    // Add a small delay to ensure user context is set
    setTimeout(() => {
      loadData();
    }, 100);
  }, []);

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
  }, []);

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
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedHotel && rooms.length > 0) {
      loadReservations();
      generateDateRange();
    }
  }, [selectedHotel, rooms, selectedDate, generateDateRange]);

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

  const loadData = async () => {
    try {
      setIsDataLoading(true);
      console.log('Calendar loadData - starting...');
      
      // Load company data and set it in context
      const currentUser = userContext.getCurrentUser();
      console.log('Current user from context:', currentUser);
      console.log('Company ID to fetch:', currentUser.companyId);
      
      console.log('Making API call to getCompany...');
      const companyData = await apiService.getCompany(currentUser.companyId);
      console.log('Company data loaded successfully:', companyData);
      companyContext.setCurrentCompany(companyData);
      
      // Load hotels after company is loaded
      console.log('Loading hotels after company loaded...');
      await loadHotels();
      console.log('Data loading completed, setting isDataLoading to false');
      setIsDataLoading(false);
    } catch (error) {
      console.error('Error loading user company:', error);
      // Try to load hotels anyway
      console.log('Trying to load hotels despite company error...');
      await loadHotels();
      setIsDataLoading(false);
    }
  };

  const loadHotels = async () => {
    try {
      console.log('Calendar loadHotels - starting...');
      console.log('Making API call to getHotels...');
      const hotelsData = await apiService.getHotels();
      console.log('Hotels data loaded successfully:', hotelsData);
      setHotels(hotelsData);
      if (hotelsData.length > 0) {
        const hotelId = hotelsData[0].PK.replace('LOCATION#', '');
        setSelectedHotel(hotelId);
        console.log('Selected hotel:', hotelId);
      } else {
        console.log('No hotels found in response');
      }
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const loadRooms = async (hotelId: string) => {
    try {
      const roomsData = await apiService.getRooms(hotelId);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadReservations = async () => {
    if (!selectedHotel) return;

    setLoading(true);
    try {
      const startDate = moment(selectedDate).startOf('month').format('YYYY-MM-DD');
      const endDate = moment(selectedDate).endOf('month').format('YYYY-MM-DD');
      
      console.log('Loading reservations for:', { selectedHotel, startDate, endDate });
      const reservationsData = await apiService.getReservations(selectedHotel, startDate, endDate);
      console.log('Loaded reservations:', reservationsData);
      setReservations(reservationsData);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    if (roomStatus.status === 'booked') {
      // Edit existing reservation
      const reservation = reservations.find(res => res.PK === roomStatus.reservationId);
      if (reservation) {
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
      setSelectedEvent(event);
      setIsModalOpen(true);
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
      <div className="calendar-controls">
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

      <div className="room-calendar-grid">
        <div className="room-list">
          <div className="room-header">
            <select
              id="hotel-select"
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="hotel-dropdown"
            >
              {hotels.map((hotel) => (
                <option key={hotel.PK} value={hotel.PK.replace('LOCATION#', '')}>
                  {hotel.Name}
                </option>
              ))}
            </select>
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
                      roomStatus.isTransitionDay ? (
                        // Transition day - split cell
                        <>
                          <div 
                            className="cell-half left-half"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Find the ending reservation
                              const endingReservation = reservations.find(res => 
                                res.RoomId === room.Number && res.CheckOutDate === moment(date).format('YYYY-MM-DD')
                              );
                              if (endingReservation) {
                                const event: CalendarEvent = {
                                  id: endingReservation.PK,
                                  title: endingReservation.ContactName,
                                  start: new Date(endingReservation.CheckInDate),
                                  end: new Date(endingReservation.CheckOutDate),
                                  resource: {
                                    roomId: endingReservation.RoomId,
                                    roomNumber: endingReservation.RoomId,
                                    reservationId: extractReservationId(endingReservation.PK),
                                    status: endingReservation.Status,
                                  },
                                  reservation: {
                                    ContactName: endingReservation.ContactName,
                                    ContactLastName: endingReservation.ContactLastName || '',
                                    CheckInDate: endingReservation.CheckInDate,
                                    CheckOutDate: endingReservation.CheckOutDate,
                                    Status: endingReservation.Status,
                                    Guests: endingReservation.Guests || [],
                                  },
                                };
                                setSelectedEvent(event);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                            <div className="check-out-arrow">►</div>
                          </div>
                          <div 
                            className="cell-half right-half"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Find the starting reservation
                              const startingReservation = reservations.find(res => 
                                res.RoomId === room.Number && res.CheckInDate === moment(date).format('YYYY-MM-DD')
                              );
                              if (startingReservation) {
                                const event: CalendarEvent = {
                                  id: startingReservation.PK,
                                  title: startingReservation.ContactName,
                                  start: new Date(startingReservation.CheckInDate),
                                  end: new Date(startingReservation.CheckOutDate),
                                  resource: {
                                    roomId: startingReservation.RoomId,
                                    roomNumber: startingReservation.RoomId,
                                    reservationId: extractReservationId(startingReservation.PK),
                                    status: startingReservation.Status,
                                  },
                                  reservation: {
                                    ContactName: startingReservation.ContactName,
                                    ContactLastName: startingReservation.ContactLastName || '',
                                    CheckInDate: startingReservation.CheckInDate,
                                    CheckOutDate: startingReservation.CheckOutDate,
                                    Status: startingReservation.Status,
                                    Guests: startingReservation.Guests || [],
                                  },
                                };
                                setSelectedEvent(event);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                            <div className="check-in-arrow">◄</div>
                          </div>
                        </>
                      ) : roomStatus.isCheckOutDay ? (
                        // Only checkout day - split cell with green right half
                        <>
                          <div 
                            className="cell-half left-half"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (roomStatus.reservationId) {
                                const event: CalendarEvent = {
                                  id: roomStatus.reservationId,
                                  title: roomStatus.guestName || '',
                                  start: new Date(roomStatus.checkIn || ''),
                                  end: new Date(roomStatus.checkOut || ''),
                                  resource: {
                                    roomId: roomStatus.roomId,
                                    roomNumber: roomStatus.roomNumber,
                                    reservationId: roomStatus.reservationId,
                                    status: 'booked',
                                  },
                                };
                                setSelectedEvent(event);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                            <div className="check-out-arrow">►</div>
                          </div>
                          <div 
                            className="cell-half right-half available"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open create new reservation modal
                              const event: CalendarEvent = {
                                id: 'new',
                                title: 'New Reservation',
                                start: date,
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
                            {/* Green half for new reservation */}
                          </div>
                        </>
                      ) : roomStatus.isCheckInDay ? (
                        // Only check-in day - split cell with green left half
                        <>
                          <div 
                            className="cell-half left-half available"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open create new reservation modal
                              const event: CalendarEvent = {
                                id: 'new',
                                title: 'New Reservation',
                                start: date,
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
                            {/* Green half for new reservation */}
                          </div>
                          <div 
                            className="cell-half right-half"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (roomStatus.reservationId) {
                                const event: CalendarEvent = {
                                  id: roomStatus.reservationId,
                                  title: roomStatus.guestName || '',
                                  start: new Date(roomStatus.checkIn || ''),
                                  end: new Date(roomStatus.checkOut || ''),
                                  resource: {
                                    roomId: roomStatus.roomId,
                                    roomNumber: roomStatus.roomNumber,
                                    reservationId: roomStatus.reservationId,
                                    status: 'booked',
                                  },
                                };
                                setSelectedEvent(event);
                                setIsModalOpen(true);
                              }
                            }}
                          >
                            <div className="check-in-arrow">◄</div>
                          </div>
                        </>
                      ) : (
                        // Regular booked day or check-in day
                        <div className="reservation-bar">
                          {roomStatus.isCheckInDay && <div className="check-in-arrow">◄</div>}
                          {roomStatus.isCheckOutDay && <div className="check-out-arrow">►</div>}
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
        event={selectedEvent}
        rooms={rooms}
        hotelId={selectedHotel}
      />
    </div>
  );
};

export default CalendarComponent;