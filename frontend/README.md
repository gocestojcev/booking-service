# Booking System Frontend

A React TypeScript frontend application that mimics the .NET booking system interface, connecting to a FastAPI backend with DynamoDB.

## Features

- **Calendar Interface**: Interactive calendar view showing room availability
- **Reservation Management**: Create, edit, and delete reservations
- **Guest Management**: Add and manage multiple guests per reservation
- **Room Selection**: Choose from available rooms
- **Status Management**: Track reservation status (Confirmed, Pending, Cancelled)
- **Real-time Updates**: Calendar refreshes after changes

## Technology Stack

- **React 18** with TypeScript
- **React Big Calendar** for calendar functionality
- **Moment.js** for date handling
- **Axios** for API communication
- **React Modal** for reservation forms
- **CSS3** for styling

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- FastAPI backend running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

### Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App

## API Integration

The frontend connects to the FastAPI backend with the following endpoints:

- `GET /hotels/` - Get all hotels
- `GET /hotels/{id}` - Get specific hotel
- `GET /hotels/{id}/rooms` - Get rooms for a hotel
- `GET /hotels/{id}/reservations` - Get reservations for a date range
- `POST /hotels/{id}/reservations` - Create new reservation
- `PUT /hotels/{id}/reservations/{id}` - Update reservation

## Components

### Calendar Component
- Main calendar interface
- Room availability display
- Click to create/edit reservations
- Status-based color coding

### Reservation Modal
- Form for creating/editing reservations
- Guest management
- Room selection
- Status management

## Styling

The application uses custom CSS to mimic the original .NET application's design:
- Clean, professional interface
- Color-coded reservation statuses
- Responsive design for mobile devices
- Modal-based forms

## Development

The frontend is built with modern React patterns:
- Functional components with hooks
- TypeScript for type safety
- Modular component structure
- Custom CSS for styling