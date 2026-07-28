import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Salons from './pages/Salons';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import { auth } from './services/auth';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = auth.getCurrent();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/login' element={<Login />} />
          <Route path='/' element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path='/salons' element={<ProtectedRoute><Salons /></ProtectedRoute>} />
          <Route path='/transactions' element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
