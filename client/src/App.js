// File: client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthContext } from './context/AuthContext';

// Layout Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GigsList from './pages/GigsList';
import GigDetails from './pages/GigDetails';
import JobsList from './pages/JobsList';
import JobDetails from './pages/JobDetails';
//import FindFreelancers from './pages/FindFreelancers';
//import FreelancerProfile from './pages/FreelancerProfile';

// Private Pages
import Dashboard from './pages/Dashboard';
import CreateGig from './pages/CreateGig';
import EditGig from './pages/EditGig';
import CreateJob from './pages/CreateJob';
import EditJob from './pages/EditJob';
import OrderDetails from './pages/OrderDetails';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Conversation from './pages/Conversation';
import Wallet from './components/Wallet';
//import Portfolio from './pages/Portfolio';
import NotFound from './pages/NotFound';

// Role-based Route Guards
const ClientRoute = ({ children }) => {
  return (
    <PrivateRoute>
      <ClientRoleCheck>
        {children}
      </ClientRoleCheck>
    </PrivateRoute>
  );
};

const FreelancerRoute = ({ children }) => {
  return (
    <PrivateRoute>
      <FreelancerRoleCheck>
        {children}
      </FreelancerRoleCheck>
    </PrivateRoute>
  );
};

// Role Check Components
const ClientRoleCheck = ({ children }) => {
  const { activeRole } = React.useContext(AuthContext);
  
  if (activeRole !== 'client') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-300 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You need to be logged in as a client to access this page.</p>
          <p className="mb-4">
            Please log out and log back in as a client, or activate your client account from the dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

const FreelancerRoleCheck = ({ children }) => {
  const { activeRole } = React.useContext(AuthContext);
  
  if (activeRole !== 'freelancer') {
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-300 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="mb-4">You need to be logged in as a freelancer to access this page.</p>
          <p className="mb-4">
            Please log out and log back in as a freelancer, or activate your freelancer account from the dashboard.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Gigs Routes */}
              <Route path="/gigs" element={<GigsList />} />
              <Route path="/gigs/:id" element={<GigDetails />} />
              
              {/* Jobs Routes */}
              <Route path="/jobs" element={<JobsList />} />
              <Route path="/jobs/:id" element={<JobDetails />} />
              
              {/* Freelancer Routes */}
              {/* <Route path="/find-freelancers" element={<FindFreelancers />} />
              <Route path="/freelancers/:id" element={<FreelancerProfile />} /> */}
              
              {/* Private Routes (require login) */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
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
              
              <Route path="/wallet" element={
                <PrivateRoute>
                  <Wallet />
                </PrivateRoute>
              } />
              
              <Route path="/orders/:id" element={
                <PrivateRoute>
                  <OrderDetails />
                </PrivateRoute>
              } />
              
              {/* Client-only Routes */}
              <Route path="/create-job" element={
                <ClientRoute>
                  <CreateJob />
                </ClientRoute>
              } />
              
              <Route path="/jobs/:id/edit" element={
                <ClientRoute>
                  <EditJob />
                </ClientRoute>
              } />
              
              <Route path="/jobs/my-jobs" element={
                <ClientRoute>
                  <JobsList isMyJobs={true} />
                </ClientRoute>
              } />
              
              {/* Freelancer-only Routes */}
              <Route path="/create-gig" element={
                <FreelancerRoute>
                  <CreateGig />
                </FreelancerRoute>
              } />
              
              <Route path="/gigs/:id/edit" element={
                <FreelancerRoute>
                  <EditGig />
                </FreelancerRoute>
              } />
              
              <Route path="/gigs/my-gigs" element={
                <FreelancerRoute>
                  <GigsList isMyGigs={true} />
                </FreelancerRoute>
              } />
              
              {/* <Route path="/portfolio" element={
                <FreelancerRoute>
                  <Portfolio />
                </FreelancerRoute>
              } /> */}
              
              {/* 404 and Redirects */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;