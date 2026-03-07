import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { AdminPage } from '@/pages/AdminPage';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { useMemoStore } from '@/store/memoStore';
import { useDeadlineStore } from '@/store/deadlineStore';
import { useRequestStore } from '@/store/requestStore';
import { Toaster } from '@/components/common/Toaster';

export default function App() {
  const initCourses = useCourseStore(s => s.init);
  const initUsers = useAuthStore(s => s.initUsers);
  const initMemos = useMemoStore(s => s.init);
  const initDeadlines = useDeadlineStore(s => s.init);
  const initRequests = useRequestStore(s => s.init);

  useEffect(() => {
    initCourses();
    initUsers();
    initMemos();
    initDeadlines();
    initRequests();
  }, []);

  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <SchedulePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
