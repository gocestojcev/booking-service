import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_ENDPOINT || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('API Request interceptor - getting token...');
      const token = await authService.getAccessToken();
      console.log('API Request interceptor - token:', token ? 'Present' : 'Missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('API Request interceptor - Authorization header added');
      } else {
        console.log('API Request interceptor - No token available, request will be unauthorized');
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response received:', response.status, response.config.url, response.data);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      try {
        await authService.signOut();
        window.location.reload();
      } catch (logoutError) {
        console.error('Error during logout:', logoutError);
      }
    }
    return Promise.reject(error);
  }
);

export interface Company {
  PK: string;
  SK: string;
  EntityType: string;
  Name: string;
  GSI1PK: string;
  GSI1SK: string;
}

export interface Hotel {
  PK: string;
  SK: string;
  EntityType: string;
  Name: string;
  CompanyId: string;
  sort_number: number;
  GSI1PK: string;
  GSI1SK: string;
}

export interface Room {
  PK: string;
  SK: string;
  EntityType: string;
  LocationId: string;
  Type: string;
  Number: string;
  Note: string;
  IsActive: boolean;
  GSI2PK: string;
  GSI2SK: string;
}

export interface Guest {
  first_name: string;
  last_name: string;
}

export interface Reservation {
  reservation_id: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  contact_name: string;
  contact_last_name: string;
  contact_phone: string;
  notes: string;
  guests: Guest[];
  is_deleted?: boolean;
  deleted_on?: string;
  deleted_by?: string;
}

export interface ReservationResponse {
  PK: string;
  SK: string;
  EntityType: string;
  RoomId: string;
  CheckInDate: string;
  CheckOutDate: string;
  Status: string;
  RoomPrice: number;
  TransportPrice: number;
  ContactName: string;
  ContactLastName: string;
  ContactPhone: string;
  Notes: string;
  UserId: string;
  ModifiedBy: string;
  CreatedOn: string;
  ModifiedOn: string;
  IsDeleted: boolean;
  DeletedOn?: string;
  DeletedBy?: string;
  GSI3PK: string;
  GSI3SK: string;
  GSI4PK: string;
  GSI4SK: string;
  GSI5PK: string;
  GSI5SK: string;
  Guests?: Guest[];
}

export const apiService = {
  // Companies
  getCompanies: async (): Promise<Company[]> => {
    const response = await api.get('/companies/');
    return response.data.companies;
  },

  getCompany: async (companyId: string): Promise<Company> => {
    const response = await api.get(`/companies/${companyId}`);
    return response.data.company;
  },

  // Hotels
  getHotels: async (): Promise<Hotel[]> => {
    const response = await api.get('/hotels/');
    return response.data.hotels;
  },

  getHotel: async (hotelId: string): Promise<Hotel> => {
    const response = await api.get(`/hotels/${hotelId}`);
    return response.data.hotel;
  },

  // Rooms
  getRooms: async (hotelId: string): Promise<Room[]> => {
    const response = await api.get(`/hotels/${hotelId}/rooms`);
    return response.data.rooms;
  },

  // Reservations
  getReservations: async (hotelId: string, startDate: string, endDate: string): Promise<ReservationResponse[]> => {
    const response = await api.get(`/hotels/${hotelId}/reservations`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data.reservations;
  },

  createReservation: async (hotelId: string, reservation: Reservation): Promise<ReservationResponse> => {
    const response = await api.post(`/hotels/${hotelId}/reservations`, reservation);
    return response.data.reservation;
  },

  updateReservation: async (hotelId: string, reservationId: string, reservation: Partial<Reservation>): Promise<ReservationResponse> => {
    const response = await api.put(`/hotels/${hotelId}/reservations/${reservationId}`, reservation);
    return response.data.reservation;
  },

  deleteReservation: async (hotelId: string, reservationId: string): Promise<ReservationResponse> => {
    const response = await api.delete(`/hotels/${hotelId}/reservations/${reservationId}`);
    return response.data.reservation;
  },

  getDeletedReservations: async (hotelId: string, startDate: string, endDate: string): Promise<ReservationResponse[]> => {
    const response = await api.get(`/hotels/${hotelId}/reservations/deleted`, {
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data.deleted_reservations;
  },
};

export default api;
