import React from 'react'
// import FaceLogin from "./src/pages/auth/FaceLogin.jsx";
// import ForgotPassword from "./src/pages/auth/ForgotPassword.jsx";
// import Register from "./src/pages/auth/Register.jsx";
// import Login from "./src/pages/auth/Login.jsx";
// import CalendarLink from "./src/pages/CalendarLink.jsx";
// import PayrollExport from "./src/pages/PayrollExport.jsx";
// import Integrations from "./src/pages/Integrations.jsx";
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import TrainMachine from './pages/TrainMachine.jsx'
import TestMachine from './pages/TestMachine.jsx'
import EmotionDetection from './pages/EmotionDetection.jsx'
import FaceLogin from './pages/auth/FaceLogin.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Register from './pages/auth/Register.jsx';
import Login from './pages/Login.jsx';
import CalendarLink from './pages/CalendarLink.jsx';
import PayrollExport from './pages/PayrollExport.jsx';
import Integrations from './pages/Integrations.jsx'
// import Login from './pages/auth/Login.jsx';
// import Login from './pages/Login.jsx'
// import ForgotPassword from './pages/ForgotPassword.jsx'
// import Integrations from "./src/pages/Integrations.jsx";
// import PayrollExport from "./src/pages/PayrollExport.jsx";
// import CalendarLink from "./src/pages/CalendarLink.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      

      {/* Protected shell */}
      {/* <Route element={<ProtectedRoute />}> */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/train-machine" element={<TrainMachine />} />
          <Route path="/test-machine" element={<TestMachine />} />
          <Route path="/emotion-detection" element={<EmotionDetection />} />
          <Route path="/integrations" element={<Integrations />} />
        </Route>
      {/* </Route> */}
      <Route path="/integrations" element={<Integrations />} />
  <Route path="/payroll" element={<PayrollExport />} />
  <Route path="/calendar-feed" element={<CalendarLink />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot" element={<ForgotPassword />} />
  <Route path="/face-login" element={<FaceLogin />} />
</Routes>
  )
}
