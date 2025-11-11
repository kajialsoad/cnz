import axios from 'axios';

class TranslationService {
    private cache = new Map<string, string>();
    private apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

    async translate(text: string, targetLang: 'bn'): Promise<string> {
        if (!text || text.trim() === '') return text;

        const cacheKey = `${text}_${targetLang}`;

        // Check cache first
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        try {
            // If no API key, return original text
            if (!this.apiKey) {
                console.warn('Google Translate API key not configured');
                return text;
            }

            const response = await axios.post(
                `https://translation.googleapis.com/language/translate/v2`,
                {
                    q: text,
                    target: targetLang,
                    format: 'text',
                },
                {
                    params: { key: this.apiKey },
                }
            );

            const translated = response.data.data.translations[0].translatedText;

            // Cache the translation
            this.cache.set(cacheKey, translated);

            return translated;
        } catch (error) {
            console.error('Translation API error:', error);
            // Return original text as fallback
            return text;
        }
    }

    async translateBatch(texts: string[], targetLang: 'bn'): Promise<string[]> {
        if (!this.apiKey) {
            console.warn('Google Translate API key not configured');
            return texts;
        }

        try {
            const response = await axios.post(
                `https://translation.googleapis.com/language/translate/v2`,
                {
                    q: texts,
                    target: targetLang,
                    format: 'text',
                },
                {
                    params: { key: this.apiKey },
                }
            );

            const translations = response.data.data.translations.map(
                (t: any) => t.translatedText
            );

            // Cache all translations
            texts.forEach((text, index) => {
                const cacheKey = `${text}_${targetLang}`;
                this.cache.set(cacheKey, translations[index]);
            });

            return translations;
        } catch (error) {
            console.error('Batch translation error:', error);
            return texts;
        }
    }

    clearCache(): void {
        this.cache.clear();
    }

    getCacheSize(): number {
        return this.cache.size;
    }
}

export const translationService = new TranslationService();
