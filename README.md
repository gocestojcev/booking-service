# Hotel Booking System

A modern, full-stack hotel booking application built with React, FastAPI, and AWS services.

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, hosted on AWS S3 + CloudFront
- **Backend**: FastAPI with Python, deployed on AWS Lambda
- **Database**: DynamoDB with single-table design
- **Authentication**: AWS Cognito
- **Infrastructure**: Terraform (Infrastructure as Code)

## 🚀 Live Application

- **Frontend**: https://d250rdy15p5hge.cloudfront.net
- **API**: https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod

## 📁 Project Structure

```
booking/
├── backend/                 # FastAPI backend
│   ├── src/
│   │   └── booking_system/
│   │       ├── api/         # API endpoints
│   │       ├── auth/        # Authentication
│   │       ├── models/      # Data models
│   │       └── services/    # Business logic
│   ├── requirements.txt
│   └── .env
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   └── config/          # Configuration
│   ├── public/
│   ├── package.json
│   ├── .env
│   └── .env.production
├── deployment/              # Lambda deployment
│   ├── lambda_handler.py
│   ├── requirements.txt
│   └── deploy-lambda.ps1
├── terraform/               # Infrastructure as Code
│   ├── *.tf                # Terraform configurations
│   ├── scripts/
│   └── terraform.tfvars
└── README.md
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- Python 3.9+
- AWS CLI configured
- Terraform

### Quick Start (Both Frontend & Backend)

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend
npm run startall
```

### Individual Development

**Backend Development:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn src.booking_system.api.v1.main:app --reload
```

**Frontend Development:**
```bash
cd frontend
npm install
npm start
```

### Available NPM Scripts

```bash
# Development
npm run startall          # Start both frontend and backend
npm run start:backend     # Start backend only
npm run start:frontend    # Start frontend only
npm run install:all       # Install all dependencies

# Building
npm run build:frontend    # Build frontend for production

# Deployment
npm run deploy:all        # Deploy entire application
npm run deploy:backend    # Deploy backend only
npm run deploy:frontend   # Deploy frontend only
```

### Infrastructure Deployment

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```
COGNITO_REGION=eu-central-1
COGNITO_USER_POOL_ID=eu-central-1_i66pYQHZR
COGNITO_APP_CLIENT_ID=7s5edv23i1rihuh83uvsif4ss1
DYNAMODB_TABLE_NAME=booking-system
```

**Frontend (.env):**
```
REACT_APP_API_URL=https://05omu2hiva.execute-api.eu-central-1.amazonaws.com/prod
REACT_APP_AWS_REGION=eu-central-1
REACT_APP_USER_POOL_ID=eu-central-1_i66pYQHZR
REACT_APP_USER_POOL_WEB_CLIENT_ID=7s5edv23i1rihuh83uvsif4ss1
```

## 📊 Database Schema

DynamoDB single-table design with 5 Global Secondary Indexes:

- **PK**: Partition Key (e.g., `COMPANY#comp1`, `HOTEL#hotel1`)
- **SK**: Sort Key (e.g., `HOTEL#hotel1`, `ROOM#101`)
- **GSI1**: Company-based queries
- **GSI2**: Hotel-based queries  
- **GSI3**: Room-based queries
- **GSI4**: Reservation-based queries
- **GSI5**: Date-based queries

## 🔐 Authentication

- AWS Cognito User Pool
- JWT token validation
- Password change flow for new users
- Session management with automatic token refresh

## 🎨 Features

- **Calendar Interface**: Visual room availability with color coding
- **Split-cell Visualization**: Check-in/check-out day indicators
- **Real-time Updates**: Live data from DynamoDB
- **Responsive Design**: Mobile-friendly interface
- **User Management**: Cognito-based authentication

## 🚀 Deployment

### Frontend Deployment

```bash
cd frontend
npm run build
aws s3 sync build/ s3://booking-system-frontend-675316576819/ --profile private
```

### Backend Deployment

```bash
cd deployment
.\deploy-lambda.ps1
```

### Full Stack Deployment

```bash
cd terraform/scripts
.\deploy-app.ps1
```

## 📝 API Endpoints

- `GET /health` - Health check
- `GET /companies/` - List companies
- `GET /hotels/` - List hotels
- `GET /hotels/{hotel_id}/rooms/` - List rooms
- `GET /hotels/{hotel_id}/reservations/` - List reservations
- `POST /hotels/{hotel_id}/reservations/` - Create reservation
- `PUT /hotels/{hotel_id}/reservations/{reservation_id}` - Update reservation
- `DELETE /hotels/{hotel_id}/reservations/{reservation_id}` - Delete reservation

## 🔧 Technologies Used

- **Frontend**: React 18, TypeScript, AWS Amplify v6
- **Backend**: FastAPI, Python 3.9, Pydantic
- **Database**: DynamoDB
- **Authentication**: AWS Cognito
- **Infrastructure**: Terraform, AWS Lambda, S3, CloudFront, API Gateway
- **Deployment**: AWS CLI, PowerShell scripts

## 📄 License

This project is proprietary software.