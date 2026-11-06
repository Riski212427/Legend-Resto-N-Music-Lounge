import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initTheme } from './utils/theme';

// Initialize theme class and attributes on root element
initTheme();

createRoot(document.getElementById('root')!).render(<App />);

