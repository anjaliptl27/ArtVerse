import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Define types
type AuthStatus = 'checking' | 'authenticated' | 'not-authenticated';
type UserRole = 'buyer' | 'artist' | 'admin'; 

// Import components
import Login from './components/Login';
import Signup from './components/Signup';
import Home from './pages/Home';
import BuyerProfile from './pages/BuyerProfile';
import ArtistDashboard from './pages/ArtistDashboard';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import ArtistProfile from './pages/ArtistProfile';
import ArtistDetail from './pages/ArtistDetail';
import Artists from './pages/Artists'
import Artworks from './pages/Artworks';
import ArtworkDetail from './components/ArtworkDetail';
import Courses from './pages/Courses';
import Navbar from './components/Navbar';
import CourseDetail from './pages/CourseDetail';
import EditProfile from './components/EditBuyerProfile';
import ContactUs from './components/ContactUs';
import Footer from './components/Footer'


 const App = () => {
  const [status, setStatus] = useState<AuthStatus>('checking');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Check auth status on component mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated 
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role') as UserRole | null;
        
        if (token && role) {
          setUserRole(role);
          setStatus('authenticated');
        } else {
          setStatus('not-authenticated');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setStatus('not-authenticated');
      }
    };

    checkAuth();
  }, []);

  // Handle successful login
  const handleLogin = (role: UserRole, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    setUserRole(role);
    setStatus('authenticated');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUserRole(null);
    setStatus('not-authenticated');
  };

  if (status === 'checking') {
    return <div className="loading">Checking credentials...</div>;
  }

  return (
    <BrowserRouter>
    <Navbar/>
      <Routes>
        {/* Public routes */}
        {status === 'not-authenticated' && (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artworks" element={<Artworks />} />
            <Route path="/courses" element={<Courses/>} />
            <Route path="/courses/:id" element={<CourseDetail/>} />
            <Route path="/contact" element={<ContactUs/>} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        )}

        {/* Authenticated routes */}
        {status === 'authenticated' && (
          <>
            {/* Common authenticated routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/artists" element={<Artists />} />
            <Route path="/artworks" element={<Artworks />} />
            <Route path="/courses" element={<Courses/>} />
              <Route path="/contact" element={<ContactUs/>} />

            {/* Buyer-specific routes */}
            {userRole === 'buyer' && (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/buyer-profile" element={<BuyerProfile />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/artists/:id" element={<ArtistDetail/>} />
                <Route path="/artworks/:id" element={<ArtworkDetail/>} />
              <Route path="/courses/:id" element={<CourseDetail/>} />
                <Route path="/edit-profile" element={<EditProfile/>} />
                   <Route path="/login" element={<Login onLogin={handleLogin} />} />

              </>
            )}

            {/* Artist-specific routes */}
            {userRole === 'artist' && (
              <>
                <Route path="/artist-dashboard" element={<ArtistDashboard />} />
                   <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/artist-profile" element={<ArtistProfile />} />
              </>
            )}

            {/* Fallback for authenticated users */}
             <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
            <Route 
              path="*" 
              element={
                <Navigate to={userRole === 'artist' ? '/artist-dashboard' : '/'} replace />
              } 
            />
          </>
        )}
      </Routes>
      <Footer/>
    </BrowserRouter>
  );
};

// Simple logout component
const Logout = ({ onLogout }: { onLogout: () => void }) => {
  useEffect(() => {
    onLogout();
  }, [onLogout]);

  return <Navigate to="/login" replace />;
};

export default App;