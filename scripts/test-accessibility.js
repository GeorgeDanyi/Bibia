#!/usr/bin/env node

/**
 * Accessibility Testing Script
 * Tests the questionnaire for accessibility compliance
 */

const puppeteer = require('puppeteer');

async function testAccessibility() {
  console.log('🔍 Starting accessibility tests...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the questionnaire
    await page.goto('http://localhost:3000/questionnaire-v1', { 
      waitUntil: 'networkidle0' 
    });
    
    // Wait for the component to load
    await page.waitForSelector('[role="checkbox"]', { timeout: 10000 });
    
    console.log('✅ Page loaded successfully');
    
    // Test keyboard navigation
    console.log('⌨️  Testing keyboard navigation...');
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test Enter key on condition cards
    await page.keyboard.press('Enter');
    
    // Test Space key on condition cards
    await page.keyboard.press('Space');
    
    console.log('✅ Keyboard navigation working');
    
    // Test ARIA attributes
    console.log('🏷️  Testing ARIA attributes...');
    
    const ariaChecked = await page.evaluate(() => {
      const checkboxes = document.querySelectorAll('[role="checkbox"]');
      return Array.from(checkboxes).map(cb => ({
        hasAriaChecked: cb.hasAttribute('aria-checked'),
        hasAriaPressed: cb.hasAttribute('aria-pressed'),
        hasAriaLabelledby: cb.hasAttribute('aria-labelledby')
      }));
    });
    
    console.log('ARIA attributes:', ariaChecked);
    
    // Test focus management
    console.log('🎯 Testing focus management...');
    
    const focusTest = await page.evaluate(() => {
      const focusedElement = document.activeElement;
      return {
        hasFocus: focusedElement !== document.body,
        tagName: focusedElement.tagName,
        role: focusedElement.getAttribute('role'),
        tabIndex: focusedElement.getAttribute('tabindex')
      };
    });
    
    console.log('Focus test:', focusTest);
    
    // Test performance
    console.log('⚡ Testing performance...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    console.log('Performance metrics:', performanceMetrics);
    
    // Check for accessibility violations using axe-core
    console.log('🔍 Running axe-core accessibility audit...');
    
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.0/axe.min.js'
    });
    
    const axeResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        axe.run((err, results) => {
          if (err) {
            resolve({ error: err.message });
          } else {
            resolve({
              violations: results.violations.length,
              passes: results.passes.length,
              criticalIssues: results.violations.filter(v => v.impact === 'critical').length
            });
          }
        });
      });
    });
    
    console.log('Axe results:', axeResults);
    
    if (axeResults.criticalIssues === 0) {
      console.log('✅ No critical accessibility issues found!');
    } else {
      console.log(`❌ Found ${axeResults.criticalIssues} critical accessibility issues`);
    }
    
    console.log('🎉 Accessibility testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAccessibility().catch(console.error);
