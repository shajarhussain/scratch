const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

describe('Selenium Automation: Group Creation (TC-GRP-01, 02)', function() {
  this.timeout(40000);
  let driver, page, auth;

  beforeEach(async () => {
    driver = await createDriver(); // Fresh session
    page = new BasePage(driver);
    auth = new AuthHelper(page);
  });

  afterEach(async function() {
    if (this.currentTest.state === 'failed') {
      await takeScreenshot(driver, this.currentTest.title);
    }
    await driver.quit();
  });

  it('[TC-GRP-01] [MM-1.1] Create Group - UI Flow', async function() {
    await auth.loginAs('student_nogroup', 'Student');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Navigate to Group Creation via Sidebar Tab
    const groupTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-group"]')), 5000);
    await groupTab.click();

    // Wait for the specific page header to confirm render
    await driver.wait(until.elementLocated(By.xpath('//h2[contains(text(), "Form Your Group")]')), 5000);

    try {
      const studentInput = await page.getElement(By.css('[data-testid="group-member-0"]'));
      await studentInput.sendKeys('SEL003'); // Use seeded student ID
      await page.click(By.css('[data-testid="group-verify-0"]'));

      // Wait for verification success (member name appearing or similar)
      await driver.sleep(2000);
      
      const supervisorInput = await page.getElement(By.css('[data-testid="group-supervisor-id"]'));
      await supervisorInput.sendKeys('SUPSEL1'); // Use seeded supervisor ID
      await page.click(By.css('[data-testid="group-verify-supervisor"]'));

      // Wait for verification
      await driver.sleep(2000);

      // Click create
      await page.click(By.css('[data-testid="group-submit"]'));
      
      // Look for success toast directly instead of redirect
      const successToast = await driver.wait(until.elementLocated(By.css('[data-testid="group-success-msg"]')), 5000);
      expect(successToast).to.not.be.null;
    } catch(err) {
      console.log('    [Note] Group creation likely blocked or already in group.');
      throw err;
    }
  });
});
