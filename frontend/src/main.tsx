import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n/config';
import App from './App'
import './index.css'
import GoogleTranslate from './components/layouts/PostLoginLayout/components/GoogleTranslate';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
