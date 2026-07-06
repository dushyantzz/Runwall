import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/router/AppRoutes';
import { AuthProvider } from '@/hooks/AuthContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
