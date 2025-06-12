
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import Index from './pages/Index';
import ScreenShareView from './components/ScreenShareView';
import ViewerView from './components/ViewerView';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/transmitter" element={<ScreenShareView />} />
        <Route path="/viewer" element={<ViewerView />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
