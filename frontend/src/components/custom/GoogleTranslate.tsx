import React, { useState, useEffect } from 'react';

// Add this to your global.d.ts or similar file to handle the Google Translate types
declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: {
      translate: {
        TranslateElement: any;
      }
    }
  }
}

const GoogleTranslate: React.FC = () => {
  const [language, setLanguage] = useState<string>('en'); // Default to English

  useEffect(() => {
    // Define the initialization function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'si,ta,en', // Sinhala, Tamil, English
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, 'google_translate_element');
      }
    };

    // Check if the Google Translate script is already loaded
    const existingScript = document.querySelector('script[src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]');
    
    if (!existingScript) {
      const googleTranslateScript = document.createElement('script');
      googleTranslateScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      googleTranslateScript.async = true;
      document.body.appendChild(googleTranslateScript);
    } else {
      // If script already exists, reinitialize
      window.googleTranslateElementInit();
    }

    return () => {
      // No need to remove the script as it might be used by other components
    };
  }, []);

  const changeLanguage = (languageCode: string) => {
    // This is the proper way to change language after the widget is loaded
    const iframe = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
    if (!iframe) return;

    const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDocument) return;

    // Find all links in the dropdown
    const links = iframeDocument.querySelectorAll('a.goog-te-menu2-item');
    
    // Find the link with the desired language
    links.forEach((link: Element) => {
      const spanElements = link.querySelectorAll('span.text');
      spanElements.forEach((span: Element) => {
        if (span.textContent?.includes(getLanguageName(languageCode))) {
          (link as HTMLElement).click();
        }
      });
    });
    
    setLanguage(languageCode);
  };

  // Helper function to map language codes to full names
  const getLanguageName = (code: string): string => {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'si': 'Sinhala',
      'ta': 'Tamil'
    };
    return languageMap[code] || code;
  };

  return (
    <div className="translate-container">
      <div id="google_translate_element" style={{ display: 'inline-block', marginBottom: '20px' }} />
      
      {/* Custom language selector */}
      {/* <div className="language-selector">
        <select 
          value={language} 
          onChange={(e) => changeLanguage(e.target.value)}
          aria-label="Select Language"
        >
          <option value="en">English</option>
          <option value="si">සිංහල</option>
          <option value="ta">தமிழ்</option>
        </select>
      </div> */}
    </div>
  );
};

export default GoogleTranslate;