describe("Report Page", () => {
  beforeEach(() => {
    cy.visitReport();
  });

  it("should display the report page", () => {
    cy.get("h1").should("contain", "Report");
  });

  it("should have proper page structure", () => {
    cy.get("body").should("be.visible");
    cy.get("div").should("have.class", "font-sans");
  });
});
