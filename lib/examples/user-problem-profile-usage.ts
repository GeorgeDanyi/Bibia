// Example usage of getUserProblemProfile for matching module consumption
// Demonstrates how the matching module can consume the clean shape

import { getUserProblemProfile } from '../hooks/useUserProblemProfile';
import { QuestionnaireAnswers } from '../types/questionnaire';

/**
 * Example: How the matching module would consume getUserProblemProfile
 */
export function exampleMatchingModuleUsage() {
  // Simulate questionnaire answers after user selections
  const questionnaireAnswers: QuestionnaireAnswers = {
    firstName: 'Jan',
    email: 'jan@example.com',
    conditionsMain: [
      { code: 'BACK_PAIN', selectedAt: '2024-01-01T10:00:00Z' },
      { code: 'NECK', selectedAt: '2024-01-01T10:01:00Z' }
    ],
    conditionsDetail: [
      { code: 'CHRONIC', selectedAt: '2024-01-01T10:00:00Z' },
      { code: 'STIFFNESS', selectedAt: '2024-01-01T10:01:00Z' }
    ],
    location: {
      type: 'address',
      address: 'Praha 1, Václavské náměstí'
    },
    distancePreference: '5km'
  };

  // Extract clean problem profile for matching
  const problemProfile = getUserProblemProfile(questionnaireAnswers);

  console.log('📋 User Problem Profile:');
  console.log('Main conditions:', problemProfile.main.map(c => c.code));
  console.log('Detail tags:', problemProfile.details.map(d => d.code));
  console.log('Is acute:', problemProfile.isAcute);
  console.log('Is chronic:', problemProfile.isChronic);

  // The matching module can now use this clean shape:
  // - problemProfile.main contains canonical condition codes
  // - problemProfile.details contains canonical detail codes  
  // - problemProfile.isAcute/isChronic provide derived flags for boosts
  
  return problemProfile;
}

/**
 * Example: Matching module logic using the problem profile
 */
export function exampleMatchingLogic(problemProfile: ReturnType<typeof getUserProblemProfile>) {
  // Extract canonical codes for matching
  const conditionCodes = problemProfile.main.map(c => c.code);
  const detailCodes = problemProfile.details.map(d => d.code);
  
  // Use derived flags for scoring boosts
  const boosts = [];
  if (problemProfile.isAcute) {
    boosts.push('acute_condition_boost');
  }
  if (problemProfile.isChronic) {
    boosts.push('chronic_condition_boost');
  }
  
  console.log('🎯 Matching criteria:');
  console.log('Condition codes:', conditionCodes);
  console.log('Detail codes:', detailCodes);
  console.log('Scoring boosts:', boosts);
  
  return {
    conditionCodes,
    detailCodes,
    boosts
  };
}

/**
 * Example: Integration with existing questionnaire context
 */
export function exampleQuestionnaireIntegration() {
  // This would typically be called from within a React component
  // that has access to the questionnaire context
  
  const mockAnswers: QuestionnaireAnswers = {
    conditionsMain: [
      { code: 'SPORT_OVERUSE', selectedAt: '2024-01-01T10:00:00Z' },
      { code: 'KNEE_LOWER_LIMB', selectedAt: '2024-01-01T10:01:00Z' }
    ],
    conditionsDetail: [
      { code: 'ACUTE', selectedAt: '2024-01-01T10:00:00Z' },
      { code: 'INFLAMMATION', selectedAt: '2024-01-01T10:01:00Z' }
    ]
  };
  
  // Extract problem profile
  const profile = getUserProblemProfile(mockAnswers);
  
  // Pass to matching module
  const matchingCriteria = exampleMatchingLogic(profile);
  
  return {
    profile,
    matchingCriteria
  };
}

// Run examples if this file is executed directly
if (require.main === module) {
  console.log('🚀 Running getUserProblemProfile examples...\n');
  
  const profile = exampleMatchingModuleUsage();
  console.log('\n');
  
  const matchingCriteria = exampleMatchingLogic(profile);
  console.log('\n');
  
  const integration = exampleQuestionnaireIntegration();
  console.log('✅ All examples completed successfully!');
}
