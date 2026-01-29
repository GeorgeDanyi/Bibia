import React from 'react'
import renderer from 'react-test-renderer'
import QuestionnaireSummary, { NormalizedQuery } from '../../search/QuestionnaireSummary'

describe('QuestionnaireSummary', () => {
  it('renders full data snapshot', () => {
    const q: NormalizedQuery = {
      city: 'Praha',
      radiusKm: 25,
      meetingType: 'clinic',
      languages: ['čeština','angličtina'],
      day: 'weekday',
      timeSlot: 'morning',
      insurance: ['VZP'],
      genderPref: 'female',
      diagnoses: [{ id: 'pelvic_floor', label: 'Pánevní dno' }],
      availabilityHint: 'do 3 dnů',
      fallback: { used: true, reason: 'no_gender_match' }
    }
    const tree = renderer.create(
      <QuestionnaireSummary q={q} onEdit={() => {}} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('renders sparse data snapshot', () => {
    const q: NormalizedQuery = {}
    const tree = renderer.create(
      <QuestionnaireSummary q={q} />
    ).toJSON()
    expect(tree).toMatchSnapshot()
  })
})


