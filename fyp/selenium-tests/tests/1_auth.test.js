const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

describe('Selenium Automation: Authentication & RBAC (TC-AUTH-01, 02, 03, ADM-03)', function() {
  this.timeout(30000);
  let driver, page, auth;

  beforeEach(async () => {
    // Session Isolation: Fresh browser session per test
    driver = await createDriver();
    page = new BasePage(driver);
    auth = new AuthHelper(page);
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      await takeScreenshot(driver, this.currentTest.title);
    }
    await driver.quit(); // Ensure session context is completely destroyed
  });

  it('[TC-AUTH-01] [MM-0.1] Valid Login - Should redirect to Student Dashboard', async function() {
    await auth.loginAs('student_nogroup', 'Student');
    // Verify redirection
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);
    const url = await driver.getCurrentUrl();
    expect(url).to.equal(env.baseUrl + '/');
  });

  it('[TC-AUTH-03] [Supp] Invalid Password - Should reject login', async function() {
    await page.navigateTo('/login');
    const emailLocator = By.css('[data-testid="login-email"]');
    const passwordLocator = By.css('[data-testid="login-password"]');
    const submitLocator = By.css('[data-testid="login-submit"]');

    await page.type(emailLocator, env.credentials.student_nogroup.email);
    await page.type(passwordLocator, 'wrongpassword!');
    await page.click(submitLocator);
    
    // Check for error text using until.elementLocated for robustness
    const errorMsg = await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Invalid email or password")]')), 5000);
    expect(await errorMsg.isDisplayed()).to.be.true;
  });

  it('[TC-AUTH-02] [MM-X1] RBAC Denial - Student cannot access Admin stats', async function() {
    await auth.loginAs('student_nogroup', 'Student');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Hard navigate to admin route
    await page.navigateTo('/admin-dashboard'); 
    
    // Expect redirection to home/dashboard or an unauthorized message
    await driver.sleep(2000); // Wait for potential redirect
    const url = await driver.getCurrentUrl();
    const hasErrorMsg = await page.isElementDisplayed(By.xpath('//*[contains(translate(text(), "UNAUTHORIZED", "unauthorized"), "unauthorized")]'));
    
    expect(url.includes('/admin-dashboard') === false || hasErrorMsg).to.be.true;
  });
});
