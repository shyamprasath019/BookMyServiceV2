import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GigsList from './pages/GigsList';
import GigDetails from './pages/GigDetails';
import CreateGig from './pages/CreateGig';
import JobsList from './pages/JobsList';
import JobDetails from './pages/JobDetails';
import CreateJob from './pages/CreateJob';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import EditJob from './pages/EditJob';
import EditGig from './pages/EditGig';
// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/gigs" element={<GigsList />} />
              <Route path="/gigs/:id" element={<GigDetails />} />
              <Route path="/gigs/:id/edit" element={<PrivateRoute><EditGig /></PrivateRoute>} />
              <Route path="/jobs" element={<JobsList />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              <Route path="/jobs/:id/edit" element={<PrivateRoute><EditJob /></PrivateRoute>} />
              
              
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/create-gig" element={
                <PrivateRoute>
                  <CreateGig />
                </PrivateRoute>
              } />
              <Route path="/create-job" element={
                <PrivateRoute>
                  <CreateJob />
                </PrivateRoute>
              } />
              <Route path="/orders/:id" element={
                <PrivateRoute>
                  <OrderDetails />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/messages" element={
                <PrivateRoute>
                  <Messages />
                </PrivateRoute>
              } />
              <Route path="/messages/:id" element={
                <PrivateRoute>
                  <Conversation />
                </PrivateRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;