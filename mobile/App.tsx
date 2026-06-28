import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import RootNavigation from './src/navigation';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigation />
    </AuthProvider>
  );
}
