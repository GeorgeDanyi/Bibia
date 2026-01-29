export const STEPS = [
	{ id: 0, key: 'contact', label: 'Kontakt' },
	{ id: 1, key: 'issues', label: 'Problémy' },
	{ id: 2, key: 'diagnosis', label: 'Diagnóza' },
	{ id: 3, key: 'time', label: 'Čas' },
	{ id: 4, key: 'location', label: 'Místo' },
	{ id: 5, key: 'preferences', label: 'Preference' },
	{ id: 6, key: 'summary', label: 'Shrnutí' },
	{ id: 7, key: 'done', label: 'Hotovo' }
] as const

export const STEP = {
	CONTACT: 0,
	ISSUES: 1,
	DIAGNOSIS: 2,
	TIME: 3,
	LOCATION: 4,
	PREFERENCES: 5,
	SUMMARY: 6,
	DONE: 7,
} as const

export type StepKey = (typeof STEPS)[number]['key']



