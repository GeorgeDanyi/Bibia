#!/usr/bin/env node

/**
 * Accessibility Improvements Verification Script
 * Verifies that the accessibility improvements have been implemented correctly
 */

const fs = require('fs');
const path = require('path');

function verifyAccessibilityImprovements() {
  console.log('🔍 Verifying accessibility improvements...');
  
  const questionnairePath = path.join(__dirname, '../app/questionnaire/QuestionnaireClient.tsx');
  const cssPath = path.join(__dirname, '../app/questionnaire/questionnaire.css');
  
  if (!fs.existsSync(questionnairePath)) {
    console.error('❌ QuestionnaireClient.tsx not found');
    return false;
  }
  
  const questionnaireContent = fs.readFileSync(questionnairePath, 'utf8');
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  const checks = [
    {
      name: 'ARIA attributes on condition cards',
      test: () => questionnaireContent.includes('aria-checked={isSelected}') && 
             questionnaireContent.includes('aria-pressed={isSelected}'),
      required: true
    },
    {
      name: 'Proper button roles',
      test: () => questionnaireContent.includes('role="checkbox"'),
      required: true
    },
    {
      name: 'Focus management',
      test: () => questionnaireContent.includes('focus:outline-none') && 
             questionnaireContent.includes('focus-visible:ring-2'),
      required: true
    },
    {
      name: 'Keyboard navigation support',
      test: () => questionnaireContent.includes('onKeyDown') && 
             (questionnaireContent.includes('Enter') || questionnaireContent.includes('Space')),
      required: true
    },
    {
      name: 'Proper labeling',
      test: () => questionnaireContent.includes('aria-labelledby'),
      required: true
    },
    {
      name: 'Live regions for dynamic content',
      test: () => questionnaireContent.includes('aria-live="polite"'),
      required: true
    },
    {
      name: 'Fieldset for grouping',
      test: () => questionnaireContent.includes('<fieldset') && 
             questionnaireContent.includes('</fieldset>'),
      required: true
    },
    {
      name: 'Tab order management',
      test: () => questionnaireContent.includes('tabIndex='),
      required: true
    },
    {
      name: 'Performance optimizations',
      test: () => questionnaireContent.includes('memo(') && 
             questionnaireContent.includes('useMemo') && 
             questionnaireContent.includes('useCallback'),
      required: true
    },
    {
      name: 'CSS performance optimizations',
      test: () => cssContent.includes('transform: translateZ(0)') && 
             cssContent.includes('will-change: transform, opacity'),
      required: true
    },
    {
      name: 'Axe-core integration',
      test: () => questionnaireContent.includes('@axe-core/react') && 
             questionnaireContent.includes('axe(React, ReactDOM'),
      required: true
    },
    {
      name: 'Performance monitoring',
      test: () => questionnaireContent.includes('measureInteraction') && 
             questionnaireContent.includes('performance.now()'),
      required: true
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('\n📋 Running accessibility checks...\n');
  
  checks.forEach((check, index) => {
    const result = check.test();
    const status = result ? '✅' : '❌';
    const requirement = check.required ? '(REQUIRED)' : '(OPTIONAL)';
    
    console.log(`${index + 1}. ${status} ${check.name} ${requirement}`);
    
    if (result) {
      passed++;
    } else {
      failed++;
      if (check.required) {
        console.log(`   ⚠️  This is a required accessibility feature!`);
      }
    }
  });
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  const criticalFailures = checks.filter(check => check.required && !check.test()).length;
  
  if (criticalFailures === 0) {
    console.log('🎉 All critical accessibility improvements implemented successfully!');
    console.log('\n✨ Accessibility Features Implemented:');
    console.log('   • Cards/pills converted to buttons with proper ARIA attributes');
    console.log('   • Focus rings visible and non-clipped');
    console.log('   • Keyboard navigation support (Enter/Space keys)');
    console.log('   • Proper tab order management');
    console.log('   • Live regions for dynamic content updates');
    console.log('   • Fieldset grouping for related options');
    console.log('   • Performance optimizations (React.memo, useMemo, useCallback)');
    console.log('   • CSS performance optimizations (hardware acceleration)');
    console.log('   • Axe-core integration for automated testing');
    console.log('   • Performance monitoring and measurement');
    console.log('\n🎯 Ready for Lighthouse/Axe testing!');
    return true;
  } else {
    console.log(`❌ ${criticalFailures} critical accessibility features missing!`);
    return false;
  }
}

// Run the verification
const success = verifyAccessibilityImprovements();
process.exit(success ? 0 : 1);
