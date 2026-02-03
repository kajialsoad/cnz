import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TranslatedTextProps {
    text: string;
    component?: React.ElementType;
    [key: string]: any;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
    text,
    component: Component = 'span',
    ...props
}) => {
    const { translate, language } = useLanguage();
    const [translatedText, setTranslatedText] = useState(text);

    useEffect(() => {
        const translateText = async () => {
            if (language === 'en') {
                setTranslatedText(text);
                return;
            }

            try {
                const translated = await translate(text);
                setTranslatedText(translated);
            } catch (error) {
                console.error('Translation failed:', error);
                setTranslatedText(text); // Fallback to original
            }
        };

        translateText();
    }, [text, language, translate]);

    return <Component {...props}>{translatedText}</Component>;
};


