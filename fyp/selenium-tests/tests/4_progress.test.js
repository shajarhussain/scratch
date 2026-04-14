const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

describe('Selenium Automation: Progress Logs (TC-PRG-01)', function() {
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

  it('[TC-PRG-01] [MM-4.1] Submit Weekly Progress Log', async function() {
    await auth.loginAs('student_ingroup', 'Student');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Navigate via Sidebar Tab (Student's tab is 'Attendance Log' for weekly progress)
    const logTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-attendance"]')), 5000);
    await logTab.click();

    try {
      const weekNumber = await driver.wait(until.elementLocated(By.css('[data-testid="progress-week-num"]')), 5000);
      await weekNumber.clear(); 
      await weekNumber.sendKeys('2');

      const tasksCompleted = await page.getElement(By.css('[data-testid="progress-tasks-completed"]'));
      await tasksCompleted.sendKeys('Refactoring Selenium Suite with data-testid');

      const nextWeekTasks = await page.getElement(By.css('[data-testid="progress-tasks-planned"]'));
      await nextWeekTasks.sendKeys('Execute full suite and generate report');

      // Optional fields like hours
      const hoursInput = await page.getElement(By.css('[data-testid="progress-hours"]'));
      await hoursInput.sendKeys('10');

      await page.click(By.css('[data-testid="progress-submit"]'));

      const successToast = await driver.wait(until.elementLocated(By.css('[data-testid="progress-success-msg"]')), 5000);
      expect(successToast).to.not.be.null;
    } catch(err) {
      console.log('    [Note] Progress log submission depends on active group presence.');
      throw err;
    }
  });
});
