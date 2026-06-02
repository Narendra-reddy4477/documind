import { Routes, Route, Navigate } from 'react-router-dom'
import Layout    from './components/Layout'
import Home      from './pages/Home'
import ChatPage  from './pages/ChatPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"            element={<Home />} />
        <Route path="/chat/:docId" element={<ChatPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
