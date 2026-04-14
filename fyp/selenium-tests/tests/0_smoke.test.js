const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

describe('Login Smoke Validation', function() {
  this.timeout(30000);
  let driver, page, auth;

  beforeEach(async () => {
    driver = await createDriver();
    page = new BasePage(driver);
    auth = new AuthHelper(page);
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      await takeScreenshot(driver, this.currentTest.title);
    }
    await driver.quit();
  });

  it('Smoke Test: Real UI Login Success', async function() {
    await auth.loginAs('student_nogroup', 'Student');
    
    // Expect redirection away from /login and to have loaded typical dashboard UI
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);
    const url = await driver.getCurrentUrl();
    expect(url).to.equal(env.baseUrl + '/');
    
    // Look for generic post-login UI content using stable hook
    const dashboardTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-dashboard"]')), 5000);
    expect(dashboardTab).to.not.be.null;

    console.log('    [Smoke] Success! Reached URL:', url);
  });
});
