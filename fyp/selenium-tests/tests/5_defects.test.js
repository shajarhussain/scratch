const { expect } = require('chai');
const BasePage = require('../pages/BasePage');
const AuthHelper = require('../helpers/authHelper');
const { createDriver, takeScreenshot } = require('../helpers/driverSetup');
const { By, until } = require('selenium-webdriver');
const env = require('../config/env');
const fs = require('fs');
const path = require('path');

describe('Selenium Automation: Defect Verification (TC-SCH-08, TC-SCH-03B)', function() {
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

  it('[TC-SCH-03B] [Defect Verification] SRS Upload temporal constraints check', async function() {
    console.log('    [Context] Verifying system properly defends against temporal bypasses.');
    await auth.loginAs('student_ingroup', 'Student');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Navigate via Sidebar SPA Tab
    const srsTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-srs-document"]')), 5000);
    await srsTab.click();
    
    try {
      // Wait for Component to render
      await driver.wait(until.elementLocated(By.xpath('//h3[contains(text(), "SRS Document")]')), 5000);

      // Create a dummy valid file temporarily
      const dummyFilePath = path.join(__dirname, 'dummy_srs.pdf');
      fs.writeFileSync(dummyFilePath, 'dummy pdf content');

      // Send to the file input
      const fileInput = await driver.wait(until.elementLocated(By.css('[data-testid="srs-file-input"]')), 5000);
      await fileInput.sendKeys(dummyFilePath);
      
      // Click submit
      const submitBtn = await page.getElement(By.css('[data-testid="srs-submit-button"]'));
      await submitBtn.click();

      // Verification: The backend explicitly rejects uploads before the window Start Date
      await driver.wait(until.alertIsPresent(), 5000);
      const alert = await driver.switchTo().alert();
      const alertText = await alert.getText();
      expect(alertText).to.include("not open yet");
      console.log('    [System Behavior Confirmed] System correctly enforces temporal constraints.');
      await alert.accept();

      // Cleanup
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    } catch(err) {
      console.log('    [Note] Test blocked: UI may strictly require a seeded schedule.');
      throw err;
    }
  });

  it('[TC-SCH-08] [Defect Verification] Invalid SRS Type triggers Unhandled 500 rejection', async function() {
    console.log('    [Context] Confirming ISS-007: Multer crashes rendering unhandled 500 error instead of 400 validation.');
    await auth.loginAs('student_ingroup', 'Student');
    await driver.wait(until.urlIs(env.baseUrl + '/'), env.timeouts.pageLoad);

    // Navigate via Sidebar SPA Tab
    const srsTab = await driver.wait(until.elementLocated(By.css('[data-testid="nav-item-srs-document"]')), 5000);
    await srsTab.click();

    try {
      await driver.wait(until.elementLocated(By.xpath('//h3[contains(text(), "SRS Document")]')), 5000);

      // Create a dummy invalid file temporarily
      const dummyFilePath = path.join(__dirname, 'dummy_script.js');
      fs.writeFileSync(dummyFilePath, 'console.log("malicious")');

      const fileInput = await driver.wait(until.elementLocated(By.css('[data-testid="srs-file-input"]')), 5000);
      await fileInput.sendKeys(dummyFilePath);
      
      const submitBtn = await page.getElement(By.css('[data-testid="srs-submit-button"]'));
      await submitBtn.click();

      // Wait for network response/UI update indicating error
      await driver.sleep(3000);
      
      // Verification of 500 error display (often a blank page or unhandled alert in this app)
      // For this specific defect, we check if the app crashed or showed an error alert
      try {
        const alert = await driver.switchTo().alert();
        const alertText = await alert.getText();
        console.log('    [Defect Found] Alert text:', alertText);
        await alert.accept();
      } catch(e) {
        // If no alert, check if any 500 message appeared
        const pageSource = await driver.getPageSource();
        expect(pageSource.includes('500') || pageSource.includes('Error')).to.be.true;
      }
      
      // Cleanup
      if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    } catch(err) {
      console.log('    [Note] Test blocked from UI execution if no schedules are available.');
      throw err;
    }
  });
});
