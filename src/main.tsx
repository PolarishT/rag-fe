
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import { isLocalAdminPreview, LOCAL_ADMIN_ACCESS_KEY } from './hooks/useAdminAccess';
import 'antd/dist/reset.css';
import './index.css';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

if (window.location.pathname === '/admin-auth') {
  if (isLocalAdminPreview()) {
    sessionStorage.setItem(LOCAL_ADMIN_ACCESS_KEY, 'authenticated');
  }

  window.location.replace('/');
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#3b82f6',
            borderRadius: 8,
            fontFamily:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
          },
          components: {
            Button: {
              borderRadius: 8,
              controlHeight: 40,
            },
          },
        }}
      >
        <App />
        <Analytics />
        <SpeedInsights />
      </ConfigProvider>
    </StrictMode>,
  );
}
