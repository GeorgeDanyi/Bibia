import { setLocation, setDiagnoses, setTimePreference, setAnswer } from './answers';

// Callback types for questionnaire components
export interface QuestionnaireCallbacks {
  onSelectCity: (city: string, coords: { lat: number; lng: number }) => void;
  onSubmitDiagnoses: (ids: string[]) => void;
  onPickTime: (day: string, slot: string) => void;
  onChangeGender: (gender: string) => void;
  onChangeMeetingType: (type: string) => void;
  onChangeRadius: (radius: number) => void;
}

// Create questionnaire callbacks
export const createQuestionnaireCallbacks = (): QuestionnaireCallbacks => ({
  onSelectCity: (city, coords) => setLocation(city, coords),
  onSubmitDiagnoses: (ids) => setDiagnoses(ids),
  onPickTime: (day, slot) => setTimePreference(day, slot),
  onChangeGender: (gender) => setAnswer("therapistGender", gender),
  onChangeMeetingType: (type) => setAnswer("meetingType", type),
  onChangeRadius: (radius) => setAnswer("radiusKm", radius),
});

// Example usage in components:
/*
import { createQuestionnaireCallbacks } from '@/lib/utils/questionnaire-callbacks';

export function CitySelector() {
  const callbacks = createQuestionnaireCallbacks();
  
  return (
    <div>
      <button onClick={() => callbacks.onSelectCity("Praha", { lat: 50.0755, lng: 14.4378 })}>
        Select Prague
      </button>
    </div>
  );
}
*/
