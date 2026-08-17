# TravelBuddies Workflow & Architecture

Welcome to **TravelBuddies**, a comprehensive, modern web application for travel planning, booking, and safety. This document serves as a complete reference for developers, summarizing the architecture, development setup, and feature modules.

---

## 1. Project Overview & Architecture

TravelBuddies is built with a decoupled architecture:
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, and Tailwind CSS.
  - UI libraries: Framer Motion, Swiper, React Icons.
  - Maps: Leaflet & React-Leaflet integration for Offline Maps and Safe Places tracking.
- **Backend**: Django 5.2, Django REST Framework (DRF), and SQLite3.
  - Apps: `bus`, `train`, `hotel`, `core`.
- **Environment**: Developed natively in WSL 2 (Ubuntu) on Windows.

## 2. Setting Up the Development Environment (WSL)

### Backend (Django) Setup
1. Open your WSL terminal and navigate to the project directory:
   ```bash
   cd /home/master_soojan/Linux_Workspaces/Projects_SW/TravelBuddies
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run database migrations:
   ```bash
   cd backend
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```
   *The backend API will be available at `http://127.0.0.1:8000/api/`.*

### Frontend (Next.js) Setup
1. Open a new WSL terminal and navigate to the frontend directory:
   ```bash
   cd /home/master_soojan/Linux_Workspaces/Projects_SW/TravelBuddies/frontend
   ```
2. Install Node dependencies (using npm or yarn):
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 3. Feature Breakdown & Routing

### Frontend Routes
- `/`: Home Page (Hero search, highlights, offers)
- `/explore`: Explore Destinations
- `/plan`: Smart Itinerary & Trip Planner
- `/hotel`, `/bus`, `/train`: Booking engines for various transportation & stay modes.
- `/lady`: Women Safety Module (Location Tracker, Safe Stay, SOS Button, Spy Camera Detection)
- `/map`: Offline Maps & Safe Places
- `/budgets`: Budget Calculator, Bill Splitting & Currency conversion
- `/holyday`: Holiday packages (Student Offers, Special Trips)
- `/login` & `/signup`: Authentication flows supporting Personal, Corporate (MyBiz), and Host accounts.

### Backend API Endpoints (DRF)
The backend exposes RESTful APIs for booking entities.
- **Hotels**: `GET /api/hotels/`, `POST /api/hotels/`, `GET /api/hotels/<id>/`
- **Trains**: `GET /api/trains/`, `POST /api/trains/`, `GET /api/trains/<id>/`
- **Buses**: `GET /api/buses/`, `POST /api/buses/`, `GET /api/buses/<id>/`

---

## 4. Git & Commit Workflow

Before committing your code, ensure you run the pre-commit checklist to avoid broken builds or exposing secrets.

### Pre-Commit Checklist
1. **Check Git Status**: Run `git status` to ensure you are not committing `.env`, `node_modules`, `venv`, or `db.sqlite3`. (Our `.gitignore` is configured to prevent this).
2. **Run Frontend Lint & Build**:
   ```bash
   cd frontend
   npm run lint
   npm run build
   ```
   Ensure the build passes with 0 errors.
3. **Run Backend Checks**:
   ```bash
   cd backend
   python manage.py check
   python manage.py test
   ```
4. **Stage & Commit**:
   ```bash
   git add .
   git commit -m "feat: descriptive message of your changes"
   ```

### WSL Git Tips
- **Line Endings**: Set Git to handle CRLF and LF properly if editing across Windows and WSL:
  ```bash
  git config --global core.autocrlf input
  ```
- **File Permissions**: To prevent Git from tracking `chmod` changes made by WSL:
  ```bash
  git config core.fileMode false
  ```
