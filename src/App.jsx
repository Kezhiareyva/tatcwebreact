import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Context
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeToggle from './components/ThemeToggle';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import News from './pages/News';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ParticipantsList from './pages/admin/ParticipantsList';
import ManagePrograms from './pages/admin/master/ManagePrograms';
import ManageProgramForm from './pages/admin/master/ManageProgramForm';
import RegistrationVerification from './pages/admin/RegistrationVerification';
import ManageModules from './pages/admin/master/ManageModules';
import ManageModuleTopics from './pages/admin/master/ManageModuleTopics';
import ManageInstructors from './pages/admin/master/ManageInstructors';
import ManageRooms from './pages/admin/master/ManageRooms';
import ManageUsers from './pages/admin/system/ManageUsers';
import NotificationQueue from './pages/admin/system/NotificationQueue';
import ParticipantDetail from './pages/admin/ParticipantDetail';
import ManageBatches from './pages/admin/academic/ManageBatches';
import ManageSessions from './pages/admin/academic/ManageSessions';
import ManageBanners from './pages/admin/cms/ManageBanners';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ManagePartners from './pages/admin/cms/ManagePartners';
import ManageNews from './pages/admin/cms/ManageNews';

// Portal Layout & Pages
import PortalLayout from './layouts/PortalLayout';
import ParticipantDashboard from './pages/portal/ParticipantDashboard';
import ParticipantSchedule from './pages/portal/ParticipantSchedule';
import InstructorDashboard from './pages/portal/InstructorDashboard';
import ManageAttendance from './pages/portal/ManageAttendance';
import ManageMaterials from './pages/portal/ManageMaterials';
import RegisterProgram from './pages/portal/RegisterProgram';
import ParticipantProfile from './pages/portal/ParticipantProfile';
import InstructorProfile from './pages/portal/InstructorProfile';

// Phase 6
import VerifyCertificate from './pages/VerifyCertificate';
import ManageExams from './pages/admin/academic/ManageExams';
import InputGrades from './pages/admin/academic/InputGrades';
import ManageCertificates from './pages/admin/academic/ManageCertificates';
import ManageBAP from './pages/admin/academic/ManageBAP';
import InstructorBAP from './pages/portal/InstructorBAP';

// Phase 7


function App() {
  return (
    <AuthProvider>
      <ThemeToggle />
      <Routes>
        {/* Existing Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/news" element={<News />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify/:certId" element={<VerifyCertificate />} />

        {/* Admin Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="participants" element={<ParticipantsList />} />
            <Route path="participants/:id" element={<ParticipantDetail />} />
            <Route path="registrations" element={<RegistrationVerification />} />
            <Route path="master/programs" element={<ManagePrograms />} />
            <Route path="master/programs/:id/form" element={<ManageProgramForm />} />
            <Route path="master/modules" element={<ManageModules />} />
            <Route path="master/modules/:moduleId/topics" element={<ManageModuleTopics />} />
            <Route path="master/instructors" element={<ManageInstructors />} />
            <Route path="master/rooms" element={<ManageRooms />} />
            <Route path="academic/batches" element={<ManageBatches />} />
            <Route path="academic/sessions" element={<ManageSessions />} />
            <Route path="academic/bap" element={<ManageBAP />} />
            <Route path="academic/exams" element={<ManageExams />} />
            <Route path="academic/grades" element={<InputGrades />} />
            <Route path="academic/certificates" element={<ManageCertificates />} />
            <Route path="cms/banners" element={<ManageBanners />} />
            <Route path="cms/partners" element={<ManagePartners />} />
            <Route path="cms/news" element={<ManageNews />} />
            <Route path="system/users" element={<ManageUsers />} />
            <Route path="system/notifications" element={<NotificationQueue />} />
          </Route>
        </Route>

        {/* Portal Routes - Protected by their own logic inside PortalLayout */}
        <Route path="/portal" element={<PortalLayout />}>
          {/* Participant Routes */}
          <Route path="participant" element={<ParticipantDashboard />} />
          <Route path="participant/schedule" element={<ParticipantSchedule />} />
          <Route path="participant/profile" element={<ParticipantProfile />} />
          <Route path="register" element={<RegisterProgram />} />
          
          {/* Instructor Routes */}
          <Route path="instructor" element={<InstructorDashboard />} />
          <Route path="instructor/attendance" element={<ManageAttendance />} />
          <Route path="instructor/materials" element={<ManageMaterials />} />
          <Route path="instructor/bap" element={<InstructorBAP />} />
          <Route path="instructor/profile" element={<InstructorProfile />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<div style={{ padding: '3rem', textAlign: 'center' }}><h1>404 - Page Not Found</h1></div>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
