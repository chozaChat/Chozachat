import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { BlurProvider } from './contexts/BlurContext';

export default function App() {
  return (
    <ThemeProvider>
      <BlurProvider>
        <RouterProvider router={router} />
        <Toaster />
      </BlurProvider>
    </ThemeProvider>
  );
}