import { useEffect, useState, useRef } from 'react';

let isScriptLoaded = false;

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const GoogleTranslate = () => {
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const googleTranslateRef = useRef<HTMLSelectElement | null>(null);
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'si', name: 'සිංහල' },
    { code: 'ta', name: 'தமிழ்' }
  ];

  useEffect(() => {
    // Don't create duplicate elements
    if (document.getElementById('google_translate_element')) return;
    
    // Create hidden translate div
    const translateDiv = document.createElement('div');
    translateDiv.id = 'google_translate_element';
    translateDiv.style.display = 'none'; // Hide the original element
    document.body.appendChild(translateDiv);

    if (!isScriptLoaded) {
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
      
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,si,ta',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        setIsTranslateReady(true);
      };
      
      isScriptLoaded = true;
    }
    
    // Hide Google Translate top bar and add notranslate class support
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame {
        display: none !important;
      }
      .goog-te-menu-value {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .skiptranslate {
        display: none !important;
      }
      .notranslate {
        /* Make sure notranslate elements stay consistent */
      }
    `;
    document.head.appendChild(style);
    
    // Add event listener to detect when Google Translate is fully loaded
    const checkForGoogleTranslate = setInterval(() => {
      const selectBox = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectBox) {
        clearInterval(checkForGoogleTranslate);
        setIsTranslateReady(true);
        googleTranslateRef.current = selectBox;
        
        // Listen for changes on the Google Translate select
        selectBox.addEventListener('change', () => {
          // Read the current language from the Google element
          updateCurrentLanguageFromGoogle(selectBox);
        });
        
        // Set up mutation observer to detect language changes
        const observer = new MutationObserver(() => {
          updateCurrentLanguageFromGoogle(selectBox);
        });
        
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['lang']
        });
        
        // Initial language update
        updateCurrentLanguageFromGoogle(selectBox);
      }
    }, 500);
    
    return () => {
      clearInterval(checkForGoogleTranslate);
      // Cleanup events
      if (googleTranslateRef.current) {
        googleTranslateRef.current.removeEventListener('change', () => {});
      }
    };
  }, []);
  
  // Helper function to determine the current language from Google Translate
  const updateCurrentLanguageFromGoogle = (selectBox: HTMLSelectElement) => {
    const htmlElement = document.documentElement;
    const translateElement = selectBox;
    
    if (htmlElement.lang === 'si') {
      setCurrentLanguage('si');
    } else if (htmlElement.lang === 'ta') {
      setCurrentLanguage('ta');
    } else {
      // Check if Google has a different language setting
      if (translateElement.value) {
        setCurrentLanguage(translateElement.value);
      } else {
        setCurrentLanguage('en');
      }
    }
  }
  
  const changeLanguage = (languageCode: string) => {
    if (!isTranslateReady || !googleTranslateRef.current) return;
    
    // Update the Google Translate dropdown
    const selectBox = googleTranslateRef.current;
    
    // First set the value
    selectBox.value = languageCode;
    
    // Then trigger the change event
    const event = new Event('change', { bubbles: true });
    selectBox.dispatchEvent(event);
    
    // Update our state
    setCurrentLanguage(languageCode);
  };
  
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const languageCode = e.target.value;
    console.log( e.target.value, "eeee");
    
    changeLanguage(languageCode);
  };
  
  // Get display name for current language
  const getCurrentLanguageName = () => {
    const language = languages.find(lang => lang.code === currentLanguage);
    return language ? language.name : 'English';
  };
  console.log(currentLanguage, ":currentLanguage");
  
  useEffect(() => {
    if (!isTranslateReady || !googleTranslateRef.current) return;
  
    const selectBox = googleTranslateRef.current;
    if (selectBox.value !== currentLanguage) {
      selectBox.value = currentLanguage;
      const event = new Event('change', { bubbles: true });
      selectBox.dispatchEvent(event);
    }
  }, [currentLanguage, isTranslateReady]);
  
  return (
    <div className="custom-translate notranslate" translate="no">
      <select 
        value={currentLanguage}
        onChange={handleSelectChange}
        className="notranslate"
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          padding: '8px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: 'white',
          fontSize: '14px',
          cursor: 'pointer',
        }}
        aria-label="Select language"
        disabled={!isTranslateReady}
        translate="no"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="notranslate" translate="no">
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default GoogleTranslate;