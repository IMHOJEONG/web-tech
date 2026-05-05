'use client'

import { useTranslations } from 'next-intl'
import { FormEvent, useState } from 'react'

type ContactValues = {
    name: string
    email: string
    message: string
}

type ContactErrors = Partial<Record<keyof ContactValues, string>>

const INITIAL_VALUES: ContactValues = {
    name: '',
    email: '',
    message: '',
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function ContactForm() {
    const t = useTranslations('about.contact')
    const [values, setValues] = useState<ContactValues>(INITIAL_VALUES)
    const [errors, setErrors] = useState<ContactErrors>({})
    const [submitMessage, setSubmitMessage] = useState('')

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        const nextErrors: ContactErrors = {}

        if (!values.name.trim()) {
            nextErrors.name = t('validation.nameRequired')
        }

        if (!values.email.trim()) {
            nextErrors.email = t('validation.emailRequired')
        } else if (!isValidEmail(values.email.trim())) {
            nextErrors.email = t('validation.emailInvalid')
        }

        if (!values.message.trim()) {
            nextErrors.message = t('validation.messageRequired')
        }

        setErrors(nextErrors)

        if (Object.keys(nextErrors).length > 0) {
            setSubmitMessage('')
            return
        }

        setSubmitMessage(t('validation.reviewMessage'))
    }

    return (
        <form className="space-y-8" noValidate onSubmit={handleSubmit}>
            <div className="grid gap-8 md:grid-cols-2">
                <label className="space-y-2">
                    <span className="font-display text-xs tracking-widest uppercase text-outline">
                        {t('fields.name.label')}
                    </span>
                    <input
                        value={values.name}
                        onChange={(event) => {
                            setValues((prev) => ({
                                ...prev,
                                name: event.target.value,
                            }))
                            setErrors((prev) => ({ ...prev, name: undefined }))
                        }}
                        aria-invalid={Boolean(errors.name)}
                        className="w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                        placeholder={t('fields.name.placeholder')}
                    />
                    {errors.name ? (
                        <p className="text-sm text-red-400">{errors.name}</p>
                    ) : null}
                </label>
                <label className="space-y-2">
                    <span className="font-display text-xs tracking-widest uppercase text-outline">
                        {t('fields.email.label')}
                    </span>
                    <input
                        value={values.email}
                        onChange={(event) => {
                            setValues((prev) => ({
                                ...prev,
                                email: event.target.value,
                            }))
                            setErrors((prev) => ({
                                ...prev,
                                email: undefined,
                            }))
                        }}
                        aria-invalid={Boolean(errors.email)}
                        className="w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                        placeholder={t('fields.email.placeholder')}
                    />
                    {errors.email ? (
                        <p className="text-sm text-red-400">{errors.email}</p>
                    ) : null}
                </label>
            </div>

            <label className="space-y-2">
                <span className="font-display text-xs tracking-widest uppercase text-outline">
                    {t('fields.message.label')}
                </span>
                <textarea
                    value={values.message}
                    onChange={(event) => {
                        setValues((prev) => ({
                            ...prev,
                            message: event.target.value,
                        }))
                        setErrors((prev) => ({
                            ...prev,
                            message: undefined,
                        }))
                    }}
                    aria-invalid={Boolean(errors.message)}
                    className="min-h-32 w-full border-b border-outline-variant bg-surface-container-lowest px-3 py-4 text-base text-on-surface outline-none transition-colors focus:border-primary"
                    placeholder={t('fields.message.placeholder')}
                />
                {errors.message ? (
                    <p className="text-sm text-red-400">{errors.message}</p>
                ) : null}
            </label>

            <div className="space-y-3">
                <button
                    type="submit"
                    className="inline-flex items-center justify-center bg-primary-container px-12 py-4 font-display text-base tracking-widest text-on-primary-container uppercase shadow-glow-primary transition-transform hover:-translate-y-0.5"
                >
                    {t('submit')}
                </button>

                {submitMessage ? (
                    <p className="text-sm text-zinc-400">{submitMessage}</p>
                ) : null}
            </div>
        </form>
    )
}
