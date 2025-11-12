describe("Home Page", () => {
  beforeEach(() => {
    cy.visitHome();
  });

  it("should display the home page", () => {
    cy.get("h1").should("contain", "Hello World");
  });

  it("should have proper page structure", () => {
    cy.get("body").should("be.visible");
    cy.get("div").should("have.class", "font-sans");
  });
});
