# FeedLot Pro - Frontend Development Guide

## Phase 1.2: Auth Frontend (Next Step)

### What We Have Ready
- ✅ Backend authentication API (`/api/auth/*`)
- ✅ Axios HTTP client with JWT interceptors (`api-service.js`)
- ✅ Zustand auth store (`auth-store.js`)
- ✅ Tailwind CSS theme configured
- ✅ Vite build system

### What We Need to Build

#### 1. Login Page (`src/pages/LoginPage.jsx`)

```jsx
Features needed:
- Email input field
- Password input field
- "Sign In" button
- "Create account" link
- Error message display
- Loading state during login
- Redirect to dashboard on success
- Remember me checkbox (optional for Phase 1)

API Call:
- POST /api/auth/login
  - Body: { email, password }
  - Returns: { user, accessToken, refreshToken }
  - Store tokens in localStorage (handled by store)
```

#### 2. Register Page (`src/pages/RegisterPage.jsx`)

```jsx
Features needed:
- Name input field
- Email input field
- Password input field
- Confirm password field
- Password strength indicator
  - Show requirements: 8+ chars, uppercase, lowercase, number
- "Create Account" button
- "Already have account? Sign in" link
- Error handling for:
  - Email already exists (409)
  - Weak password
  - Validation errors
- Loading state during registration

API Call:
- POST /api/auth/register
  - Body: { name, email, password }
  - Returns: { user, accessToken, refreshToken }
```

#### 3. Protected Route Component (`src/components/ProtectedRoute.jsx`)

```jsx
Purpose: Wrap routes that require authentication

Logic:
- Check if user is authenticated (useAuthStore)
- If yes: render the page
- If no: redirect to /login
- Show loading spinner while checking auth
```

#### 4. Layout Component (`src/components/Layout.jsx`)

```jsx
Features needed:
- Header with app logo & title "FeedLot Pro"
- Sidebar (desktop) or BottomNav (mobile)
- Navigation items:
  - Dashboard
  - Animals
  - Weights
  - Feed (Phase 2)
  - Veterinary (Phase 2)
  - Analytics (Phase 2)
  - Reports (Phase 2)
  - Admin (if user is admin)
  - Settings
- User profile button with logout
- Mobile responsive
```

#### 5. App Router (`src/App.jsx`)

```jsx
Structure:
- Public routes:
  - /login - LoginPage
  - /register - RegisterPage

- Protected routes (require auth):
  - / - DashboardPage (default)
  - /animals - AnimalsPage
  - /weights - WeightsPage
  - (others in Phase 2)

- 404 page
```

---

## Phase 1.3: Dashboard UI

### Dashboard Page (`src/pages/DashboardPage.jsx`)

```jsx
Statistics Cards:
1. Total Animals
   - Display count
   - API: GET /api/animals/stats/overview → total_animals

2. Average Weight
   - Display in kg
   - API: GET /api/animals/stats/overview → avg_weight

3. Active Animals
   - Display count
   - API: GET /api/animals/stats/overview → active_count

4. Ready for Sale
   - Display count
   - API: GET /api/animals/stats/overview → ready_for_sale_count

Quick Actions Section:
- Add New Animal button → Opens modal
- View All Animals button → Navigate to /animals

Recent Activity (if time):
- Show last 5 animals added
- Show last weight entries
```

### Animals Page (`src/pages/AnimalsPage.jsx`)

```jsx
Features:
1. Table showing all animals:
   - Tag Number (sortable)
   - Breed
   - Current Weight
   - Target Weight
   - Status (active/ready/culled)
   - Actions (Edit, Delete)

2. Add Animal Button
   - Opens modal form
   - Fields: tag_number, breed, date_added, current_weight, target_weight
   - API: POST /api/animals

3. Edit Animal Modal
   - Pre-fill with current data
   - Update selected fields
   - API: PUT /api/animals/:id

4. Pagination
   - Default 20 per page
   - Navigate pages

5. Search/Filter
   - Filter by status
   - Search by tag number or breed
```

### Weights Page (`src/pages/WeightsPage.jsx`)

```jsx
Features:
1. Bulk Weight Entry Form
   - Date picker
   - Table with animal rows
   - Input field for each animal's weight
   - Submit button
   - API: POST /api/weight-records/bulk
   - Show success message after

2. Weight History by Animal
   - Dropdown to select animal
   - Show weight progression
   - Display ADG calculation
   - API: GET /api/weight-records/:animalId
   - API: GET /api/weight-records/:animalId/adg

3. Weight Graph
   - Line chart showing weight over time
   - X-axis: Date
   - Y-axis: Weight (kg)
   - Library: Recharts (already installed)

4. Weight Loss Alerts
   - Display animals that lost weight
   - API: GET /api/weight-records/weight-loss-alerts
   - Show: tag_number, previous_weight, current_weight, change
```

---

## Development Priorities

### Week 1 (Auth & Core UI)
1. **Day 1-2: Auth Pages**
   - Login page
   - Register page
   - Test with backend

2. **Day 3: Protected Routes**
   - Setup route protection
   - Redirect logic
   - Auth context

3. **Day 4: Layout**
   - Header component
   - Sidebar/bottom nav
   - Responsive design

4. **Day 5: Dashboard**
   - Stats cards
   - Quick actions
   - Layout integration

### Week 2 (Core Features)
1. **Day 1-2: Animals Page**
   - Animals list table
   - Add animal form
   - Edit animal form

2. **Day 3-4: Weights Page**
   - Bulk weight input
   - Weight graph (Recharts)
   - ADG calculation display

3. **Day 5: Polish & Testing**
   - Error handling
   - Loading states
   - Test all flows

---

## Component Checklist

```
src/
├── pages/
│   ├── LoginPage.jsx                    ☐ Build
│   ├── RegisterPage.jsx                 ☐ Build
│   ├── DashboardPage.jsx                ☐ Build
│   ├── AnimalsPage.jsx                  ☐ Build
│   ├── WeightsPage.jsx                  ☐ Build
│   └── NotFoundPage.jsx                 ☐ Build
│
├── components/
│   ├── Layout.jsx                       ☐ Build
│   ├── Sidebar.jsx                      ☐ Build
│   ├── Header.jsx                       ☐ Build
│   ├── ProtectedRoute.jsx               ☐ Build
│   ├── Forms/
│   │   ├── AddAnimalForm.jsx           ☐ Build
│   │   ├── BulkWeightForm.jsx          ☐ Build
│   │   └── LoginForm.jsx               ☐ Build
│   ├── Cards/
│   │   ├── StatCard.jsx                ☐ Build
│   │   └── AnimalCard.jsx              ☐ Build
│   ├── Tables/
│   │   ├── AnimalsTable.jsx            ☐ Build
│   │   └── WeightHistoryTable.jsx      ☐ Build
│   ├── Charts/
│   │   └── WeightChart.jsx             ☐ Build
│   └── Modals/
│       ├── AddAnimalModal.jsx          ☐ Build
│       └── ConfirmModal.jsx            ☐ Build
│
├── hooks/
│   ├── useAuth.js                      ✅ Use useAuthStore
│   └── useAPI.js                       ☐ Build (for data fetching)
│
├── styles/
│   └── index.css                       ☐ Build (import Tailwind)
│
├── App.jsx                             ☐ Build (Router setup)
├── api-service.js                      ✅ Ready
├── auth-store.js                       ✅ Ready
└── index.jsx                           ☐ Build (React entry)
```

---

## Styling with Tailwind

Colors available in theme:
```javascript
// Agricultural theme
primary: '#2D5016'        // Dark green
accent: '#8B6F47'         // Earth brown
background: '#F5F1E8'     // Cream
success: '#22863A'        // Green
warning: '#ED8D00'        // Orange
danger: '#CB2431'         // Red
```

### Component Styling Examples

```jsx
// Button component
<button className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-md">
  Sign In
</button>

// Card component
<div className="bg-background rounded-lg shadow-md p-6">
  {/* content */}
</div>

// Input component
<input className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary" />
```

---

## Error Handling Strategy

All API calls should handle:
1. **Network error** - Show generic error message
2. **Validation error (400)** - Show specific field errors
3. **Unauthorized (401)** - Clear tokens, redirect to login
4. **Conflict (409)** - Email exists, show specific message
5. **Server error (500)** - Show error message, retry option

Example:
```jsx
try {
  await login(email, password);
  navigate('/');
} catch (error) {
  if (error.response?.status === 401) {
    setError('Invalid email or password');
  } else if (error.response?.status === 400) {
    setError(error.response.data.message);
  } else {
    setError('Something went wrong. Please try again.');
  }
}
```

---

## Testing with Backend

Before building each page:

1. **Verify API endpoint works**
   ```bash
   curl http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@feedlotpro.com","password":"Admin@123"}'
   ```

2. **Test with Postman or Thunder Client**
   - Import API collection
   - Test each endpoint
   - Verify response format

3. **Test JWT token flow**
   - Login → get accessToken
   - Use token in Authorization header
   - Verify protected routes work

---

## Next Steps

1. **Create frontend folder structure** (if not using Vite template)
2. **Set up routing** with React Router
3. **Build LoginPage first** (simplest to debug)
4. **Test auth flow** with backend
5. **Build Dashboard** (shows immediate value)
6. **Build Animals & Weights** pages in parallel

---

## Helpful Resources

- Recharts Documentation: https://recharts.org/
- Tailwind CSS: https://tailwindcss.com/
- React Router: https://reactrouter.com/
- Zustand: https://github.com/pmndrs/zustand
- Axios Interceptors: https://axios-http.com/docs/interceptors

---

**Ready to start frontend development!** All backend APIs are complete and tested.
