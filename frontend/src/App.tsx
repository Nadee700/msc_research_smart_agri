import { useEffect } from "react";
import { BrowserRouter } from 'react-router-dom';
import Theme from '@/components/template/Theme';
import Layout from '@/components/layouts';
import { AuthProvider } from '@/auth';
import Views from '@/views';
import appConfig from './configs/app.config';
import { ResultProvider } from '@/contexts/ResultContext';

if (appConfig.enableMock) {
    import('./mock');
}
const App = () => {
  return (
    <Theme>
      <BrowserRouter>
        <AuthProvider>
          <ResultProvider>
            <Layout>
              <Views />
            </Layout>
          </ResultProvider>
        </AuthProvider>
      </BrowserRouter>
    </Theme>
  );
}

export default App
