/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to visit the home page
       * @example cy.visitHome()
       */
      visitHome(): Chainable<void>;

      /**
       * Custom command to visit the report page
       * @example cy.visitReport()
       */
      visitReport(): Chainable<void>;
    }
  }
}

Cypress.Commands.add("visitHome", () => {
  cy.visit("/");
});

Cypress.Commands.add("visitReport", () => {
  cy.visit("/report");
});

export {};
