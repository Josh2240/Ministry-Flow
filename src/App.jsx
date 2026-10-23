import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PlannerLayout from './components/planner/PlannerLayout';
import SiteLayout from './components/site/SiteLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PlannerDashboard from './pages/planner/Dashboard';
import PlannerSchedule from './pages/planner/Schedule';
import PlannerTeam from './pages/planner/Team';
import PlannerAvailability from './pages/planner/Availability';
import PlannerSwaps from './pages/planner/Swaps';
import PlannerSongs from './pages/planner/Songs';
import PlannerSignups from './pages/planner/Signups';
import PlannerServiceDetail from './pages/planner/ServiceDetail';
import Home from './pages/site/Home';
import ServePage from './pages/site/ServePage';
import ServiceTimesPage from './pages/site/ServiceTimesPage';
import SongsSetlistsPage from './pages/site/SongsSetlistsPage';

function NotFoundPage() {
  return <div className="p-8 text-center">Page not found</div>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/planner" element={<PlannerLayout />}>
              <Route index element={<PlannerDashboard />} />
              <Route path="schedule" element={<PlannerSchedule />} />
              <Route path="schedule/:serviceId" element={<PlannerServiceDetail />} />
              <Route path="team" element={<PlannerTeam />} />
              <Route path="availability" element={<PlannerAvailability />} />
              <Route path="swaps" element={<PlannerSwaps />} />
              <Route path="songs" element={<PlannerSongs />} />
              <Route path="signups" element={<PlannerSignups />} />
            </Route>
          </Route>
          
          <Route path="/" element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="serve" element={<ServePage />} />
            <Route path="service-times" element={<ServiceTimesPage />} />
            <Route path="servicetimes" element={<ServiceTimesPage />} />
            <Route path="songs-setlists" element={<SongsSetlistsPage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
