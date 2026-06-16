import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type Locale, type MessageKey, messages } from "@/shared/i18n/messages";

type InterpolationValues = Record<string, number | string>;

interface I18nContextValue {
  locale: Locale;
  t: (key: MessageKey, values?: InterpolationValues) => string;
  formatDateTime: (value: string | null) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  locale = "ko",
}: {
  children: ReactNode;
  locale?: Locale;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t = (key: MessageKey, values?: InterpolationValues) => {
      const template = messages[locale][key] ?? messages.ko[key];

      if (!values) {
        return template;
      }

      return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
        const value = values[name];
        return value === undefined ? "" : String(value);
      });
    };

    const formatDateTime = (value: string | null) => {
      if (!value) {
        return t("common.notAvailableYet");
      }

      return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value));
    };

    return {
      locale,
      t,
      formatDateTime,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return context;
}
