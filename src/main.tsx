import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Seed default teacher account (leo123 / leo0001) if no users exist yet
function seedDefaultUser() {
  const existing = localStorage.getItem('aq_users');
  if (existing && JSON.parse(existing).length > 0) return;
  const defaultUser = {
    id: '0273719c-7f6a-4f90-8da0-c05d728526cc',
    username: 'leo123',
    displayName: 'Leo',
    passwordHash: '23115faa0cd8bc0d8649a92bf6daa826969d89f30d83155447c5a64ab7a187b0',
    role: 'teacher',
    createdAt: 1772731466528,
  };
  localStorage.setItem('aq_users', JSON.stringify([defaultUser]));
}

seedDefaultUser();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
