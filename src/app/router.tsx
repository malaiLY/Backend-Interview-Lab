import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import QuestionBank from '@/pages/QuestionBank';
import QuestionDetail from '@/pages/QuestionDetail';
import ReviewCards from '@/pages/ReviewCards';
import Mistakes from '@/pages/Mistakes';
import Interview from '@/pages/Interview';

export default function Router() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="questions" element={<QuestionBank />} />
        <Route path="questions/:id" element={<QuestionDetail />} />
        <Route path="review" element={<ReviewCards />} />
        <Route path="mistakes" element={<Mistakes />} />
        <Route path="interview" element={<Interview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
