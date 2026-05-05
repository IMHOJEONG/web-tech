'use client'

import { useTranslations } from 'next-intl'

export const Brand = () => {
    const t = useTranslations('common')

    return <>{t('brand')}</>
}
