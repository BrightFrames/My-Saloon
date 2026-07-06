import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Salons from './pages/Salons';
import Login from './pages/Login';
import { auth } from './services/auth';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = auth.getCurrent();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path='/' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path='/salons' element={<ProtectedRoute><Salons /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
