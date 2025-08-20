import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import ActionLogRecord from './pages/ActionLogRecord';
import ActionLogList from './pages/ActionLogList';
import OrderManagement from './pages/OrderManagement';
import UserMaster from './pages/UserMaster';
import KPIManagement from './pages/KPIManagement';
import PerformanceInput from './pages/PerformanceInput';
import ProposalMenuMaster from './pages/ProposalMenuMaster';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectManagement />} />
          <Route path="/action-log/record" element={<ActionLogRecord />} />
          <Route path="/action-log/list" element={<ActionLogList />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/users" element={<UserMaster />} />
          <Route path="/kpi" element={<KPIManagement />} />
          <Route path="/performance" element={<PerformanceInput />} />
          <Route path="/proposal-menu" element={<ProposalMenuMaster />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
