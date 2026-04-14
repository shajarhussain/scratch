const { By, until } = require('selenium-webdriver');
const env = require('../config/env');

class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async navigateTo(path) {
    await this.driver.get(`${env.baseUrl}${path}`);
    // Implicit document ready wait
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState');
      return readyState === 'complete';
    }, env.timeouts.pageLoad);
  }

  async getElement(locator, fallbackLocator = null) {
    try {
      const el = await this.driver.wait(until.elementLocated(locator), env.timeouts.explicit);
      await this.driver.wait(until.elementIsVisible(el), env.timeouts.explicit);
      return el;
    } catch (err) {
      if (fallbackLocator) {
        console.log(`    [Retry] Primary locator failed, trying fallback...`);
        const fallbackEl = await this.driver.wait(until.elementLocated(fallbackLocator), env.timeouts.explicit);
        await this.driver.wait(until.elementIsVisible(fallbackEl), env.timeouts.explicit);
        return fallbackEl;
      }
      throw err;
    }
  }

  async click(locator, fallback = null) {
    const el = await this.getElement(locator, fallback);
    await el.click();
  }

  async type(locator, text, fallback = null) {
    const el = await this.getElement(locator, fallback);
    await el.clear();
    await el.sendKeys(text);
  }

  async isElementDisplayed(locator) {
    try {
      const el = await this.driver.wait(until.elementLocated(locator), 2000);
      return await el.isDisplayed();
    } catch (err) {
      return false;
    }
  }
}

module.exports = BasePage;
