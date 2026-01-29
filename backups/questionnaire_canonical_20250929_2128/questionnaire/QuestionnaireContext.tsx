"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type AnswersShape = Record<string, any>

type QuestionnaireState = {
	step: number
	answers: AnswersShape
}

type QuestionnaireActions = {
	setStep: (step: number) => void
	setAnswers: (updater: (prev: AnswersShape) => AnswersShape) => void
	reset: () => void
}

const Ctx = createContext<{ state: QuestionnaireState; actions: QuestionnaireActions } | null>(null)

export function QuestionnaireProvider({ children }: { children: React.ReactNode }) {
	const [step, setStepState] = useState<number>(0)
	const [answers, setAnswersState] = useState<AnswersShape>({})

	const setStep = useCallback((s: number) => setStepState(s), [])
	const setAnswers = useCallback((updater: (prev: AnswersShape) => AnswersShape) => {
		setAnswersState(prev => updater(prev))
	}, [])

	const reset = useCallback(() => {
		setAnswersState({})
		setStepState(0)
	}, [])

	const value = useMemo(() => ({ state: { step, answers }, actions: { setStep, setAnswers, reset } }), [step, answers, setStep, setAnswers, reset])

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useQuestionnaire() {
	const ctx = useContext(Ctx)
	if (!ctx) throw new Error('useQuestionnaire must be used within QuestionnaireProvider')
	return ctx
}



