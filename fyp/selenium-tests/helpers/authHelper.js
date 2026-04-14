const env = require('../config/env');
const { By, until } = require('selenium-webdriver');

class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async loginAs(credentialKey, uiRole) {
    const creds = env.credentials[credentialKey.toLowerCase()];
    if (!creds) throw new Error(`Unknown credential key: ${credentialKey}`);

    await this.page.navigateTo('/login');
    
    // Hardened selectors using data-testid
    const emailLocator = By.css('[data-testid="login-email"]');
    const passwordLocator = By.css('[data-testid="login-password"]');
    const roleSelectLocator = By.css('[data-testid="login-role"]');
    const submitLocator = By.css('[data-testid="login-submit"]');
    
    // Select role if provided or if it exists in data
    const actualRole = uiRole || (credentialKey.charAt(0).toUpperCase() + credentialKey.toLowerCase().slice(1));
    const optionLocator = By.css(`option[value="${actualRole}"]`);

    // Wait for the form to visibly mount
    await this.page.getElement(emailLocator);

    // Apply credentials
    await this.page.type(emailLocator, creds.email);
    await this.page.type(passwordLocator, creds.password);
    
    // Select role
    await this.page.click(roleSelectLocator);
    await this.page.click(optionLocator);

    // Submit
    await this.page.click(submitLocator);
  }

  async logout() {
    try {
      const logoutBtn = By.xpath("//button[contains(text(), 'Logout')] | //span[contains(text(), 'Logout')]");
      await this.page.click(logoutBtn);
    } catch(e) {
      await this.page.driver.executeScript('window.localStorage.clear(); window.sessionStorage.clear();');
      await this.page.driver.get('about:blank');
    }
  }
}

module.exports = AuthHelper;
