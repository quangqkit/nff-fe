/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      waitForPageLoad(): Chainable<void>;
      shouldBeVisibleAndClickable(selector: string): Chainable<void>;
      typeWithDelay(
        selector: string,
        text: string,
        delay?: number
      ): Chainable<void>;
      selectFromDropdown(
        dropdownSelector: string,
        optionText: string
      ): Chainable<void>;
      uploadFile(selector: string, filePath: string): Chainable<void>;
      shouldShowToast(message: string): Chainable<void>;
      waitForApiResponse(method: string, url: string): Chainable<void>;
      clearLocalStorage(): Chainable<void>;
      clearCookies(): Chainable<void>;
      resetDatabase(): Chainable<void>;
    }
  }
}
