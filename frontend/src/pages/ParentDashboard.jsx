import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import parentAPI from '../services/parentAPI';
import DashboardHeader from '../components/DashboardHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ChildOverviewCard from '../components/parent/ChildOverviewCard';
import ChildDetailView from '../components/parent/ChildDetailView';

function ParentDashboard() {
  // State management
  const [viewState, setViewState] = useState('overview'); // 'overview' | 'detail'
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Role-based access control and data fetching
  useEffect(() => {
    // Verify user role
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
    const fetchOverview = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await parentAPI.getChildrenOverview();
        setOverviewData(response.data.data);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        } else {
          setError('Failed to load children data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [navigate]);

  // Handle child card click - fetch detail data
  const handleChildClick = async (childId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await parentAPI.getChildStats(childId);
      setDetailData(response.data.data);
      setSelectedChildId(childId);
      setViewState('detail');
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied to this child\'s data.');
      } else if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load child details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle back button - return to overview
  const handleBackClick = () => {
    setViewState('overview');
    setDetailData(null);
    setSelectedChildId(null);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Get parent name from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const parentName = user.full_name || 'Parent';

  // Render loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render error state
  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader parentName={parentName} onLogout={handleLogout} />

        {/* Overview View */}
        {viewState === 'overview' && (
          <>
            {overviewData?.children.length === 0 ? (
              <EmptyState 
                icon="👨‍👩‍👧‍👦"
                message="No children linked to your account yet."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {overviewData?.children.map((child) => (
                  <ChildOverviewCard
                    key={child.id}
                    child={child}
                    onClick={handleChildClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Detail View */}
        {viewState === 'detail' && detailData && (
          <ChildDetailView 
            childData={detailData} 
            onBack={handleBackClick} 
          />
        )}
      </div>
    </div>
  );
}

export default ParentDashboard;
