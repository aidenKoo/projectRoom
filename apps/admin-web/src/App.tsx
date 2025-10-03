
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin, Button, theme as antdTheme } from 'antd';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

import { DashboardOutlined, UserOutlined, QrcodeOutlined, UnorderedListOutlined, HistoryOutlined } from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import CodeManagement from './pages/CodeManagement';
import OptionManagement from './pages/OptionManagement';
import AuditLog from './pages/AuditLog';

const { Header, Content, Sider } = Layout;

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Layout style={{ minHeight: '100vh', display:'grid', placeContent:'center' }}><Spin size="large" /></Layout>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const { token: { colorBgContainer, borderRadiusLG } } = antdTheme.useToken();
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout style={{ minHeight: '100vh' }}>
              <Sider breakpoint="lg" collapsedWidth="0">
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', color:'white', display:'grid', placeContent:'center', borderRadius: 6 }}>ProjectRoom Admin</div>
                <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]}>
                  <Menu.Item key="/" icon={<DashboardOutlined />}>
                    <Link to="/">Dashboard</Link>
                  </Menu.Item>
                  <Menu.Item key="/users" icon={<UserOutlined />}>
                    <Link to="/users">Users</Link>
                  </Menu.Item>
                  <Menu.Item key="/codes" icon={<QrcodeOutlined />}>
                    <Link to="/codes">Codes</Link>
                  </Menu.Item>
                  <Menu.Item key="/options" icon={<UnorderedListOutlined />}>
                    <Link to="/options">Options</Link>
                  </Menu.Item>
                  <Menu.Item key="/logs" icon={<HistoryOutlined />}>
                    <Link to="/logs">Audit Logs</Link>
                  </Menu.Item>
                </Menu>
              </Sider>
              <Layout>
                <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Button onClick={handleLogout}>Logout</Button>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                  <div style={{ padding: 24, minHeight: 360, background: colorBgContainer, borderRadius: borderRadiusLG }}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/codes" element={<CodeManagement />} />
                        <Route path="/options" element={<OptionManagement />} />
                        <Route path="/logs" element={<AuditLog />} />
                    </Routes>
                  </div>
                </Content>
              </Layout>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const AppWrapper: React.FC = () => (
    <BrowserRouter>
        <App />
    </BrowserRouter>
);

export default AppWrapper;
