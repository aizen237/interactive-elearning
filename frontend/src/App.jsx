import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ContentManagement from './pages/ContentManagement';
import Analytics from './pages/Analytics';
import LessonViewer from './pages/LessonViewer';
import Leaderboard from './pages/Leaderboard';
import Progress from './pages/Progress';
import FidelChartPage from './pages/FidelChartPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/content-management" element={<ContentManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/lessons" element={<LessonViewer />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/alphabet" element={<FidelChartPage />} />
      </Routes>
    </Router>
  );
}

export default App;