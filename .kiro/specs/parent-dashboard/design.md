# Design Document: Parent Dashboard

## Overview

The Parent Dashboard is a React-based frontend feature that enables parents to monitor their children's learning progress in the Amharic learning platform. The feature consists of two primary views: an overview displaying all linked children with summary statistics, and a detailed view showing comprehensive progress data for a selected child.

The design leverages existing backend API endpoints (`/api/parent/overview`, `/api/parent/children`, `/api/parent/child/:studentId/stats`) and follows established patterns from the StudentDashboard component for visual consistency. The implementation uses React hooks for state management, axios for API communication, and Tailwind CSS for responsive styling.

Key design principles:
- Component reusability and separation of concerns
- Consistent visual language with existing dashboards
- Graceful error handling and loading states
- Responsive design for mobile and desktop
- Secure authentication with JWT tokens

## Architecture

### High-Level Component Structure

```
ParentDashboard (Container Component)
├── DashboardHeader
│   ├── Welcome Message
│   └── Logout Button
├── ChildrenOverview (View State 1)
│   ├── Loading Indicator
│   ├── Error Message (conditional)
│   ├── Empty State (conditional)
│   └── ChildOverviewCard[] (grid)
└── ChildDetailView (View State 2)
    ├── Back Button
    ├── ChildHeader
    ├── XPLevelDisplay
    ├── BadgesSection
    ├── QuizStatistics
    ├── RecentQuizAttempts
    └── ModuleProgress
```

### View State Management

The ParentDashboard uses a simple view state machine:
- **OVERVIEW**: Displays all children with summary statistics
- **DETAIL**: Displays detailed statistics for a selected child

State transitions:
- OVERVIEW → DETAIL: User clicks on a ChildOverviewCard
- DETAIL → OVERVIEW: User clicks the back button

### Data Flow

```
User Action → Component Event Handler → API Service Call → State Update → UI Re-render
```

1. **Initial Load**: ParentDashboard mounts → fetch overview data → display ChildOverviewCards
2. **View Details**: Click card → fetch child stats → display ChildDetailView
3. **Return to Overview**: Click back → restore overview (no re-fetch)
4. **Logout**: Click logout → clear localStorage → redirect to login

## Components and Interfaces

### 1. ParentDashboard (Main Container)

**Responsibility**: Orchestrates view state, data fetching, and routing between overview and detail views.

**State**:
```javascript
{
  viewState: 'overview' | 'detail',
  selectedChildId: number | null,
  overviewData: {
    children: ChildOverview[],
    total_children: number
  } | null,
  detailData: ChildDetailStats | null,
  loading: boolean,
  error: string | null
}
```

**Props**: None (route-based component)

**Key Methods**:
- `fetchOverview()`: Calls GET /api/parent/overview
- `fetchChildDetails(childId)`: Calls GET /api/parent/child/:studentId/stats
- `handleChildClick(childId)`: Transitions to detail view
- `handleBackClick()`: Returns to overview view
- `handleLogout()`: Clears auth and redirects

### 2. DashboardHeader

**Responsibility**: Displays parent's name and logout functionality.

**Props**:
```javascript
{
  parentName: string,
  onLogout: () => void
}
```

**Rendering**:
- Welcome message: "Welcome back, {parentName}!"
- Logout button with red styling

### 3. ChildOverviewCard

**Responsibility**: Displays summary statistics for a single child in a clickable card format.

**Props**:
```javascript
{
  child: {
    id: number,
    full_name: string,
    username: string,
    total_xp: number,
    current_level: number,
    badges_earned: number,
    quizzes_attempted: number,
    quizzes_passed: number
  },
  onClick: (childId: number) => void
}
```

**Styling**:
- White background with rounded corners and shadow
- Gradient accent for level/XP section
- Emoji icons for visual appeal (🎯, ✅, 🏆)
- Hover effect with scale transform
- Responsive grid layout

### 4. ChildDetailView

**Responsibility**: Displays comprehensive statistics for a selected child.

**Props**:
```javascript
{
  childData: {
    student: { id: number, full_name: string },
    xp: { total_xp: number, current_level: number },
    badges: { earned: Badge[], count: number },
    quizzes: {
      recent_attempts: QuizAttempt[],
      statistics: { total_attempts: number, correct_answers: number, success_rate: number }
    },
    modules: ModuleProgress[]
  },
  onBack: () => void
}
```

**Sub-components**:
- **XPLevelDisplay**: Gradient card showing level and XP (similar to StudentDashboard)
- **BadgesSection**: Grid of badge cards with icons, names, descriptions
- **QuizStatistics**: Summary stats with emoji icons
- **RecentQuizAttempts**: List of last 5 quiz attempts with timestamps
- **ModuleProgress**: Progress bars for each module with completion percentages

### 5. LoadingSpinner

**Responsibility**: Displays loading indicator during API calls.

**Props**: None

**Rendering**: Centered spinner with "Loading dashboard..." text

### 6. ErrorMessage

**Responsibility**: Displays user-friendly error messages.

**Props**:
```javascript
{
  message: string,
  onRetry?: () => void
}
```

### 7. EmptyState

**Responsibility**: Displays helpful messages when no data is available.

**Props**:
```javascript
{
  message: string,
  icon?: string
}
```

## Data Models

### ChildOverview (from GET /api/parent/overview)

```typescript
interface ChildOverview {
  id: number;
  full_name: string;
  username: string;
  total_xp: number;
  current_level: number;
  badges_earned: number;
  quizzes_attempted: number;
  quizzes_passed: number;
}

interface OverviewResponse {
  success: boolean;
  data: {
    children: ChildOverview[];
    total_children: number;
  };
}
```

### ChildDetailStats (from GET /api/parent/child/:studentId/stats)

```typescript
interface Badge {
  id: number;
  name: string;
  description: string;
  icon_url: string;
  earned_at: string;
}

interface QuizAttempt {
  id: number;
  content_id: number;
  question_text: string;
  module_name: string;
  selected_answer: string;
  is_correct: boolean;
  score_earned: number;
  attempted_at: string;
}

interface QuizStatistics {
  total_attempts: number;
  correct_answers: number;
  success_rate: number;
}

interface ModuleProgress {
  id: number;
  module_name: string;
  description: string;
  total_items: number;
  completed_items: number;
  completion_percentage: number;
}

interface ChildDetailStats {
  student: {
    id: number;
    full_name: string;
  };
  xp: {
    total_xp: number;
    current_level: number;
  };
  badges: {
    earned: Badge[];
    count: number;
  };
  quizzes: {
    recent_attempts: QuizAttempt[];
    statistics: QuizStatistics;
  };
  modules: ModuleProgress[];
}

interface DetailResponse {
  success: boolean;
  data: ChildDetailStats;
}
```

### User (from localStorage)

```typescript
interface User {
  id: number;
  username: string;
  full_name: string;
  role: 'Parent' | 'Student' | 'Teacher';
}
```

## API Integration

### API Service Layer

Create `frontend/src/services/parentAPI.js`:

```javascript
import api from './api';

export const parentAPI = {
  // Get overview of all children
  getChildrenOverview: () => api.get('/parent/overview'),
  
  // Get list of children (alternative endpoint)
  getChildren: () => api.get('/parent/children'),
  
  // Get detailed stats for a specific child
  getChildStats: (studentId) => api.get(`/parent/child/${studentId}/stats`)
};
```

### Authentication Flow

1. **Token Retrieval**: Read JWT token from `localStorage.getItem('token')`
2. **Request Interceptor**: Automatically adds `Authorization: Bearer {token}` header (already configured in api.js)
3. **Error Handling**: 
   - 401/403 responses → redirect to `/login`
   - Network errors → display error message with retry option
   - 500 errors → display "Server error, please try again later"

### API Call Patterns

**Initial Load**:
```javascript
useEffect(() => {
  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await parentAPI.getChildrenOverview();
      setOverviewData(response.data.data);
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Failed to load children data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  fetchOverview();
}, []);
```

**Detail View Load**:
```javascript
const handleChildClick = async (childId) => {
  setLoading(true);
  setError(null);
  try {
    const response = await parentAPI.getChildStats(childId);
    setDetailData(response.data.data);
    setSelectedChildId(childId);
    setViewState('detail');
  } catch (error) {
    if (error.response?.status === 403) {
      setError('Access denied to this child\'s data.');
    } else if (error.response?.status === 401) {
      navigate('/login');
    } else {
      setError('Failed to load child details. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};
```

## Routing Configuration

### Route Definition

Add to `frontend/src/App.jsx`:

```javascript
import ParentDashboard from './pages/ParentDashboard';

// Inside Routes component:
<Route path="/parent-dashboard" element={<ParentDashboard />} />
```

### Route Protection

The ParentDashboard component should verify the user's role on mount:

```javascript
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!user.role) {
    navigate('/login');
    return;
  }
  
  if (user.role !== 'Parent') {
    // Redirect to appropriate dashboard
    const dashboardMap = {
      'Student': '/student-dashboard',
      'Teacher': '/teacher-dashboard'
    };
    navigate(dashboardMap[user.role] || '/login');
    return;
  }
  
  // User is a parent, proceed with data fetching
  fetchOverview();
}, []);
```

### Login Redirect

Update `frontend/src/pages/Login.jsx` to redirect parents to `/parent-dashboard`:

```javascript
// After successful login
const dashboardMap = {
  'Student': '/student-dashboard',
  'Teacher': '/teacher-dashboard',
  'Parent': '/parent-dashboard'
};
navigate(dashboardMap[userData.role] || '/student-dashboard');
```

## State Management

### Component State Strategy

The ParentDashboard uses React's built-in `useState` and `useEffect` hooks for state management. This approach is consistent with existing dashboard components and appropriate for the feature's complexity level.

**State Variables**:

```javascript
const [viewState, setViewState] = useState('overview'); // 'overview' | 'detail'
const [selectedChildId, setSelectedChildId] = useState(null);
const [overviewData, setOverviewData] = useState(null);
const [detailData, setDetailData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

### State Transitions

**Loading States**:
- Initial load: `loading = true` until overview data fetched
- Detail load: `loading = true` until child stats fetched
- Display LoadingSpinner component when `loading === true`

**Error States**:
- API failure: Set `error` message and display ErrorMessage component
- 401/403: Redirect to login (no error display)
- Network error: Display "Network error, please check your connection"

**Data Caching**:
- Overview data persists when navigating to detail view
- No re-fetch when returning from detail to overview
- Refresh on component remount (user navigates away and back)

### Performance Considerations

- **Memoization**: Use `useMemo` for computed values (e.g., sorting children)
- **Callback Optimization**: Use `useCallback` for event handlers passed to child components
- **Conditional Rendering**: Only render detail view when `viewState === 'detail'`
- **Lazy Loading**: Consider code-splitting if bundle size becomes large

## Error Handling

### Error Categories

1. **Authentication Errors (401/403)**:
   - Clear localStorage
   - Redirect to `/login`
   - No user-facing error message (silent redirect)

2. **Authorization Errors (403 on child stats)**:
   - Display: "Access denied. This child is not linked to your account."
   - Provide back button to return to overview

3. **Network Errors**:
   - Display: "Network error. Please check your connection and try again."
   - Provide retry button

4. **Server Errors (500)**:
   - Display: "Server error. Please try again later."
   - Provide retry button

5. **Data Validation Errors**:
   - Handle null/undefined data gracefully
   - Display empty states with helpful messages

### Error Handling Implementation

```javascript
const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  
  if (error.response) {
    const status = error.response.status;
    
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
      return;
    }
    
    if (status === 403) {
      setError('Access denied. You do not have permission to view this data.');
      return;
    }
    
    if (status >= 500) {
      setError('Server error. Please try again later.');
      return;
    }
  }
  
  if (error.request) {
    setError('Network error. Please check your connection and try again.');
    return;
  }
  
  setError('An unexpected error occurred. Please try again.');
};
```

### Empty State Handling

```javascript
// No children linked
{overviewData?.children.length === 0 && (
  <EmptyState 
    icon="👨‍👩‍👧‍👦"
    message="No children linked to your account yet."
  />
)}

// No badges earned
{detailData?.badges.count === 0 && (
  <EmptyState 
    icon="🏆"
    message="No badges earned yet. Keep learning to unlock achievements!"
  />
)}

// No quiz attempts
{detailData?.quizzes.recent_attempts.length === 0 && (
  <EmptyState 
    icon="🎯"
    message="No quiz attempts yet."
  />
)}

// No module progress
{detailData?.modules.length === 0 && (
  <EmptyState 
    icon="📚"
    message="No modules started yet."
  />
)}
```

## Testing Strategy

### Unit Testing

**Component Tests** (using React Testing Library and Vitest):

1. **ParentDashboard Component**:
   - Renders loading state initially
   - Fetches overview data on mount
   - Displays ChildOverviewCards when data loaded
   - Handles API errors gracefully
   - Redirects to login on 401/403
   - Transitions to detail view on card click
   - Returns to overview on back button click

2. **ChildOverviewCard Component**:
   - Renders child's name, level, XP correctly
   - Displays badge count, quiz stats correctly
   - Calls onClick handler when clicked
   - Applies hover styles correctly

3. **ChildDetailView Component**:
   - Renders child's name and XP/level
   - Displays badges grid correctly
   - Shows empty state when no badges
   - Renders quiz statistics correctly
   - Displays recent quiz attempts with timestamps
   - Shows module progress bars with percentages
   - Calls onBack handler when back button clicked

4. **DashboardHeader Component**:
   - Displays parent's name correctly
   - Calls onLogout when logout button clicked

5. **EmptyState Component**:
   - Renders message and icon correctly

6. **ErrorMessage Component**:
   - Displays error message correctly
   - Calls onRetry when retry button clicked

**API Service Tests**:

1. **parentAPI.getChildrenOverview**:
   - Makes GET request to correct endpoint
   - Includes Authorization header
   - Returns data in expected format

2. **parentAPI.getChildStats**:
   - Makes GET request with correct studentId
   - Includes Authorization header
   - Returns data in expected format

### Integration Testing

1. **Full User Flow**:
   - Parent logs in → redirected to /parent-dashboard
   - Overview loads and displays children
   - Click child card → detail view loads
   - Click back → returns to overview
   - Click logout → redirected to login

2. **Error Scenarios**:
   - API returns 401 → redirects to login
   - API returns 403 on child stats → shows error message
   - Network error → shows error with retry button
   - Retry button → re-fetches data

3. **Empty States**:
   - Parent with no children → shows empty state
   - Child with no badges → shows empty state in detail view
   - Child with no quiz attempts → shows empty state

### Manual Testing Checklist

- [ ] Parent can log in and see dashboard
- [ ] Overview displays all linked children
- [ ] Child cards show correct statistics
- [ ] Clicking child card loads detail view
- [ ] Detail view shows comprehensive stats
- [ ] Back button returns to overview
- [ ] Logout clears auth and redirects
- [ ] Responsive layout works on mobile
- [ ] Responsive layout works on tablet
- [ ] Responsive layout works on desktop
- [ ] Loading indicators display correctly
- [ ] Error messages display correctly
- [ ] Empty states display correctly
- [ ] 401 error redirects to login
- [ ] 403 error shows access denied message
- [ ] Network error shows retry button
- [ ] Retry button re-fetches data

### Test Data Setup

Use existing `backend/scripts/setupParentTestData.js` to create test data:
- Parent user with multiple linked children
- Children with varying levels of progress (some with badges, some without)
- Children with quiz attempts and module progress
- Child with no activity (0 XP, no badges, no quizzes)

## UI/UX Specifications

### Color Palette

Following StudentDashboard patterns:

- **Background**: `bg-gradient-to-br from-purple-50 to-blue-50`
- **Primary Gradient**: `from-purple-600 to-blue-600`
- **Success**: `text-green-600`
- **Warning**: `text-yellow-600`
- **Error**: `text-red-600`
- **Card Background**: `bg-white`
- **Text Primary**: `text-gray-800`
- **Text Secondary**: `text-gray-600`

### Typography

- **Page Title**: `text-4xl font-bold text-gray-800`
- **Section Headers**: `text-2xl font-bold text-gray-800`
- **Card Titles**: `text-xl font-semibold text-gray-800`
- **Stats Numbers**: `text-3xl font-bold`
- **Body Text**: `text-base text-gray-600`
- **Small Text**: `text-sm text-gray-500`

### Spacing and Layout

- **Page Padding**: `p-8`
- **Max Width**: `max-w-7xl mx-auto`
- **Card Padding**: `p-6`
- **Card Spacing**: `gap-6`
- **Grid Columns**: 
  - Mobile: `grid-cols-1`
  - Tablet: `grid-cols-2`
  - Desktop: `grid-cols-3`

### Interactive Elements

- **Hover Effects**: `hover:scale-105 transition transform`
- **Button Hover**: `hover:bg-{color}-700`
- **Card Shadow**: `shadow-lg hover:shadow-xl`
- **Rounded Corners**: `rounded-2xl` for cards, `rounded-lg` for buttons

### Emoji Icons

- 🎯 Quizzes Attempted
- ✅ Quizzes Passed
- 🏆 Badges
- 📊 Statistics
- 📚 Modules
- 👨‍👩‍👧‍👦 Children/Family
- ⬅️ Back Button
- 🔄 Retry

### Responsive Breakpoints

- **Mobile**: < 768px (1 column)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns)

## Implementation Notes

### File Structure

```
frontend/src/
├── pages/
│   └── ParentDashboard.jsx (main container)
├── components/
│   ├── parent/
│   │   ├── ChildOverviewCard.jsx
│   │   ├── ChildDetailView.jsx
│   │   ├── XPLevelDisplay.jsx
│   │   ├── BadgesSection.jsx
│   │   ├── QuizStatistics.jsx
│   │   ├── RecentQuizAttempts.jsx
│   │   └── ModuleProgress.jsx
│   ├── DashboardHeader.jsx (reusable)
│   ├── LoadingSpinner.jsx (reusable)
│   ├── ErrorMessage.jsx (reusable)
│   └── EmptyState.jsx (reusable)
└── services/
    └── parentAPI.js
```

### Development Phases

**Phase 1: Core Structure**
1. Create ParentDashboard.jsx with basic layout
2. Implement parentAPI.js service
3. Add route to App.jsx
4. Implement role-based redirect in Login.jsx

**Phase 2: Overview View**
5. Create ChildOverviewCard component
6. Implement overview data fetching
7. Add loading and error states
8. Implement empty state handling

**Phase 3: Detail View**
9. Create ChildDetailView component
10. Create sub-components (XPLevelDisplay, BadgesSection, etc.)
11. Implement detail data fetching
12. Add back navigation

**Phase 4: Polish**
13. Add responsive styling
14. Implement hover effects and transitions
15. Add emoji icons
16. Test on multiple screen sizes

**Phase 5: Testing**
17. Write unit tests for all components
18. Write integration tests for user flows
19. Manual testing with test data
20. Fix bugs and edge cases

### Dependencies

All required dependencies are already installed:
- `react` and `react-dom`
- `react-router-dom` (routing)
- `axios` (API calls)
- `tailwindcss` (styling)
- `@testing-library/react` and `vitest` (testing)

No additional packages needed.

### Browser Compatibility

Target browsers:
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

### Accessibility Considerations

- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`)
- Provide alt text for icons (use aria-label)
- Ensure sufficient color contrast (WCAG AA)
- Support keyboard navigation
- Add focus indicators for interactive elements
- Use ARIA labels for screen readers

### Performance Targets

- Initial load: < 2 seconds
- View transition: < 500ms
- API response handling: < 100ms
- Smooth animations: 60fps

## Security Considerations

1. **Token Storage**: JWT stored in localStorage (existing pattern)
2. **Token Expiration**: Handle 401 responses by redirecting to login
3. **Authorization**: Backend validates parent-child relationship
4. **XSS Prevention**: React's built-in escaping prevents XSS
5. **CSRF**: Not applicable (token-based auth, no cookies)
6. **Data Validation**: Validate API responses before rendering
7. **Error Messages**: Don't expose sensitive information in error messages

## Future Enhancements

Potential features for future iterations:
- Export child progress as PDF report
- Email notifications for milestones
- Comparison view for multiple children
- Historical progress charts
- Set learning goals for children
- Filter and sort children by various metrics
- Search functionality for large families
- Dark mode support
- Offline support with service workers
- Real-time updates with WebSockets
