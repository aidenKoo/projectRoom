import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Spin, Button, theme as antdTheme } from 'antd';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './firebase';

import { DashboardOutlined, UserOutlined, QrcodeOutlined, UnorderedListOutlined, HistoryOutlined, NodeIndexOutlined, FileImageOutlined, ExperimentOutlined } from '@ant-design/icons';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import CodeManagement from './pages/CodeManagement';
import OptionManagement from './pages/OptionManagement';
import AuditLog from './pages/AuditLog';
import MatchingStatus from './pages/MatchingStatus';
import ContentManagement from './pages/ContentManagement';
import ABTestConsole from './pages/ABTestConsole';

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
                  <Menu.Item key="/matching-status" icon={<NodeIndexOutlined />}>
                    <Link to="/matching-status">Matching Status</Link>
                  </Menu.Item>
                  <Menu.Item key="/content" icon={<FileImageOutlined />}>
                    <Link to="/content">Content</Link>
                  </Menu.Item>
                  <Menu.Item key="/codes" icon={<QrcodeOutlined />}>
                    <Link to="/codes">Codes</Link>
                  </Menu.Item>
                  <Menu.Item key="/options" icon={<UnorderedListOutlined />}>
                    <Link to="/options">Options</Link>
                  </Menu.Item>
                  <Menu.Item key="/ab-tests" icon={<ExperimentOutlined />}>
                    <Link to="/ab-tests">A/B Tests</Link>
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
                        <Route path="/matching-status" element={<MatchingStatus />} />
                        <Route path="/content" element={<ContentManagement />} />
                        <Route path="/ab-tests" element={<ABTestConsole />} />
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
