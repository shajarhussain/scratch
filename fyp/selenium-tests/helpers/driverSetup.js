const { Builder, Browser } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function createDriver() {
  const driver = await new Builder().forBrowser(Browser.CHROME).build();
  await driver.manage().setTimeouts({ implicit: 5000 });
  await driver.manage().window().maximize();
  return driver;
}

async function takeScreenshot(driver, testName) {
  try {
    const safeName = testName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Screenshot
    const data = await driver.takeScreenshot();
    const imgPath = path.join(SCREENSHOT_DIR, `${safeName}_${Date.now()}.png`);
    fs.writeFileSync(imgPath, data, 'base64');
    
    // URL
    const currentUrl = await driver.getCurrentUrl();
    
    // HTML Dump
    const html = await driver.getPageSource();
    const htmlPath = path.join(SCREENSHOT_DIR, `${safeName}_${Date.now()}.html`);
    fs.writeFileSync(htmlPath, `URL: ${currentUrl}\n\n${html}`);
    
    console.log(`\n    [Evidence] Screenshot: ${imgPath}`);
    console.log(`    [Evidence] HTML Dump: ${htmlPath}`);
    return imgPath;
  } catch (err) {
    console.error('Failed to capture evidence:', err);
  }
}

module.exports = { createDriver, takeScreenshot };
