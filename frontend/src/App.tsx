import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Results from './pages/Results';
import History from './pages/History';
import Status from './pages/Status';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/history" element={<History />} />
            <Route path="/status" element={<Status />} />
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <p className="text-8xl font-black text-ink-100 mb-4">404</p>
                <p className="text-ink-600 text-sm mb-6">This page doesn't exist.</p>
                <a href="/" className="btn-primary">← Back to home</a>
              </div>
            } />
          </Routes>
        </main>
        <footer className="relative z-10 border-t border-ink-200 py-4 px-4 sm:px-6 bg-white">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-ink-400">
            <span className="font-medium text-ink-600">VendorLens</span>
            <span>Made by Vishwajeet</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
