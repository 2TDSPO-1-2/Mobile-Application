import { useI18n } from './I18nContext';

/** The everyday import for screens/components: `const { t } = useTranslation();`. */
export function useTranslation() {
  const { t, language, setLanguage } = useI18n();
  return { t, language, setLanguage };
}
