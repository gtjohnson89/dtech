import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { Layout } from './components/Layout'
import { Admin } from './pages/Admin'
import { Home } from './pages/Home'
import { ProblemDetail } from './pages/ProblemDetail'
import { Problems } from './pages/Problems'
import { ProjectDetail } from './pages/ProjectDetail'
import { Projects } from './pages/Projects'
import { Verify } from './pages/Verify'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="projects" element={<Projects />} />
            <Route path="problems" element={<Problems />} />
            <Route path="p/:id" element={<ProjectDetail />} />
            <Route path="problem/:id" element={<ProblemDetail />} />
            <Route path="admin" element={<Admin />} />
            <Route path="auth/verify" element={<Verify />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
