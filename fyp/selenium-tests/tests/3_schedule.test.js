const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

describe('Selenium Automation: Scheduling (TC-SCH-01, 02)', function() {
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

  it('[TC-SCH-01] [MM-2.1] Create Schedule - UI Verification', async function() {
    await auth.loginAs('coordinator');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Navigate via Sidebar Tab
    const schedulesTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-schedules"]')), 5000);
    await schedulesTab.click();
    
    const openModalBtn = await driver.wait(until.elementLocated(By.css('[data-testid="schedule-create-open"]')), 5000);
    await openModalBtn.click();
    
    // The Event Type must be selected FIRST to trigger the dependent rendering of the form fields
    const eventTypeBtn = await driver.wait(until.elementLocated(By.css('[data-testid="schedule-type-Proposal Defense"]')), 5000);
    await eventTypeBtn.click();

    const groupSelect = await driver.wait(until.elementLocated(By.css('[data-testid="schedule-group-select"]')), 5000);
    await groupSelect.sendKeys('SEL-2026-001');

    const dateInput = await page.getElement(By.css('[data-testid="schedule-event-date"]'));
    await dateInput.sendKeys('2026-12-15');

    // Currently the form has start/end time without data-testid, but they are unique enough by name/type
    const startInput = await page.getElement(By.css('input[type="time"]')); // First one is start
    await startInput.sendKeys('14:00');

    // Find the second time input for End Time
    const timeInputs = await driver.findElements(By.css('input[type="time"]'));
    if (timeInputs.length > 1) {
      await timeInputs[1].sendKeys('15:00');
    }

    const venueInput = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Venue" or @placeholder="Room A"] | //input[@type="text" and contains(@class, "w-full px-4")]')), 5000);
    await venueInput.sendKeys('Room C');

    // Click create
    const submitBtn = await page.getElement(By.css('[data-testid="schedule-submit"]'));
    await submitBtn.click();
    
    try {
      const successToast = await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'successfully') or contains(text(), 'Success')]")), 5000);
      expect(successToast).to.not.be.null;
    } catch(err) {
      console.log('    [Note] Schedule creation may be blocked due to missing test group or duplicate schedule state.');
      throw err;
    }
  });

  it('[TC-SCH-02] [MM-2.2] Conflict Detection Warning', async function() {
    await auth.loginAs('coordinator');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    await page.navigateTo('/schedules');
    const openModalBtn = await driver.wait(until.elementLocated(By.css('[data-testid="schedule-create-open"]')), 5000);
    await openModalBtn.click();

    // Enter conflicting details (Room A at 10:00 on 2026-12-01 as per seed)
    const dateInput = await driver.wait(until.elementLocated(By.css('[data-testid="schedule-event-date"]')), 5000);
    await dateInput.sendKeys('2026-12-01');

    const timeInputs = await driver.findElements(By.css('input[type="time"]'));
    await timeInputs[0].sendKeys('10:00');
    await timeInputs[1].sendKeys('11:00');

    const venueInput = await driver.wait(until.elementLocated(By.xpath('//input[@placeholder="Venue" or @placeholder="Room A"] | //input[@type="text" and contains(@class, "w-full px-4")]')), 5000);
    await venueInput.sendKeys('Room A');

    // Click submit
    const submitBtn = await page.getElement(By.css('[data-testid="schedule-submit"]'));
    await submitBtn.click();

    try {
      // We expect a conflict warning
      const conflictMsg = await driver.wait(until.elementLocated(By.xpath("//*[contains(translate(text(), 'CONFLICT', 'conflict'), 'conflict')]")), 5000);
      expect(conflictMsg).to.not.be.null;
    } catch(err) {
      console.log('    [Note] Conflict detection requires pre-existing conflicting data seed.');
      throw err;
    }
  });
});
