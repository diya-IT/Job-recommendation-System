import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/User/Register";
import Login from "./pages/User/Login";
import UserDashboard from "./pages/User/UserDashboard";
import RecruiterDashboard from "./pages/recuriter/RecruiterDashboard";

import AdminPortal from "./pages/admin/AdminPortal";
import OverviewTab from "./pages/admin/OverviewTab";
import CompaniesTab from "./pages/admin/CompaniesTab";
import UsersTab from "./pages/admin/UsersTab";
import SkillsTab from "./pages/admin/SkillsTab";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/UserDashboard" element={<UserDashboard />} />
  <Route path="/RecruiterDashboard" element={<RecruiterDashboard />} />

     {/* ✅ NESTED ADMIN ROUTES */}
        <Route path="/admin" element={<AdminPortal />}>
          <Route index element={<OverviewTab />} />        {/* /admin */}
          <Route path="companies" element={<CompaniesTab />} />  {/* /admin/companies */}
          <Route path="users" element={<UsersTab />} />         {/* /admin/users */}
          <Route path="skills" element={<SkillsTab />} />       {/* /admin/skills */}
        </Route>
        <Route path="*" element={<h2>Page Not Found</h2>} />

      </Routes>
    </Router>
  );
}

export default App;