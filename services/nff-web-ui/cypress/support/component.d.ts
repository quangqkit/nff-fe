export {};

declare global {
  namespace Cypress {
    interface Chainable {
      mount: any;
      login(email: string, password: string): Chainable<any>;
      waitForPageLoad(): Chainable<any>;
      shouldBeVisibleAndClickable(selector: string): Chainable<any>;
      typeWithDelay(
        selector: string,
        text: string,
        delay?: number
      ): Chainable<any>;
      selectFromDropdown(
        dropdownSelector: string,
        optionText: string
      ): Chainable<any>;
      uploadFile(selector: string, filePath: string): Chainable<any>;
      shouldShowToast(message: string): Chainable<any>;
      waitForApiResponse(method: string, url: string): Chainable<any>;
      clearLocalStorage(): Chainable<any>;
      clearCookies(): Chainable<any>;
      resetDatabase(): Chainable<any>;
    }
  }
}
