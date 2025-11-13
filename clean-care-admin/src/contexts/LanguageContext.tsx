import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translationService } from '../services/translationService';

interface LanguageContextType {
    language: 'en' | 'bn';
    setLanguage: (lang: 'en' | 'bn') => void;
    translate: (text: string) => Promise<string>;
    isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguageState] = useState<'en' | 'bn'>('en');
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        // Load saved language preference from localStorage
        const savedLanguage = localStorage.getItem('admin_language');
        if (savedLanguage === 'en' || savedLanguage === 'bn') {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: 'en' | 'bn') => {
        setLanguageState(lang);
        localStorage.setItem('admin_language', lang);
        translationService.clearCache();
    };

    const translate = async (text: string): Promise<string> => {
        if (language === 'en') return text;

        setIsTranslating(true);
        try {
            const translated = await translationService.translate(text, language);
            return translated;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Fallback to original text
        } finally {
            setIsTranslating(false);
        }
    };

    const value: LanguageContextType = {
        language,
        setLanguage,
        translate,
        isTranslating,
    };

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
