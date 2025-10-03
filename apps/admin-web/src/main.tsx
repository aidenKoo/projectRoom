import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './App';
import 'antd/dist/reset.css'; // Import Ant Design styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
);