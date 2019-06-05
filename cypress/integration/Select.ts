describe("Select Components", () => {
  before(() => {
    cy.visit("/#!/Select")
  })
  it("should be visible in the DOM", () => {
    cy.get('[data-cy="basic-select"]')
  })
  it("should be expandable via keyboard", () => {
    Cypress.on("uncaught:exception", () => {
      return false
    })
    cy.get('[data-cy="basic-select"]')
      .type(" ")
      .tab()
      .tab({ shift: true })
    cy.get('[data-cy="basic-select"]').type("{downarrow}")
    cy.tab()
    cy.tab({ shift: true })
    cy.get('[data-cy="basic-select"]').type("{uparrow}")
  })
  it("should be selectable via keyboard up/down", () => {
    cy.get('[data-cy="basic-select"]')
      .focused()
      .type("{downarrow}{downarrow}{downarrow}{downarrow}{downarrow}{uparrow} ")
    cy.get('[data-cy="basic-select"] input[value="four"]')
  })
  it("should be selectable via keyboard home", () => {
    cy.get('[data-cy="basic-select"]')
      .type(" ")
      .focused()
      .type("{home} ")
    cy.get('[data-cy="basic-select"] input[value="one"]')
  })
  it("should be selectable via keyboard end", () => {
    cy.get('[data-cy="basic-select"]')
      .type(" ")
      .focused()
      .type("{end} ")
    cy.get('[data-cy="basic-select"] input[value="eight"]')
  })
  it("should be labelled correctly", () => {
    cy.get('[data-cy="basic-select"]').contains("Basic")
  })
  it("should allow multi-select", () => {
    cy.get('[data-cy="multi-select"]')
      .type(" ")
      .focused()
      .type("{downarrow}{downarrow} ")
      .type(" ")
      .type("{downarrow}{downarrow}{downarrow} ")
      .type(" ")
      .type("{downarrow}{downarrow}{downarrow}{downarrow} ")
      .type("{esc} ")
    cy.get('[data-cy="multi-select"] input[value="two, three, four"]').type("{esc}")
  })
  it("should filter content", () => {
    cy.get('[data-cy="filterable-select"]')
      .type(" ")
      .focused()
      .type("eig{downarrow}{downarrow} ")
    cy.get('[data-cy="filterable-select"] input[value="eight"]')
  })
  it("should truncate max options", () => {
    cy.get('[data-cy="maxOptions-select"]')
      .type(" ")
      .focused()
      .type("{downarrow}{downarrow} ")
    cy.get('[data-cy="maxOptions-select"] input[value="one"]')
    cy.get('[data-cy="maxOptions-select"]')
      .type(" ")
      .focused()
      .type("{downarrow}{downarrow}{downarrow} ")
    cy.get('[data-cy="maxOptions-select"] input[value="two"]')
    cy.get('[data-cy="maxOptions-select"]')
      .type(" ")
      .focused()
      .type("{downarrow}{downarrow}{downarrow}{downarrow} ")
    cy.get('[data-cy="maxOptions-select"] input[value="three"]').should("not.exist")
    cy.get('[data-cy="maxOptions-select"]')
      .type(" ")
      .focused()
      .type("eigh{downarrow}{downarrow}{downarrow}{downarrow} ")
    cy.get('[data-cy="maxOptions-select"] input[value="eight"]')
  })
  it("should support a custom option", () => {
    cy.get('[data-cy="custom-select"]')
      .type(" ")
      .focused()
      .type("{end} ")
    cy.get('[data-cy="custom-select"] input').type("holaamigocomoestas")
    cy.get('[data-cy="custom-select"]')
      .type(" ")
      .focused()
      .type("{downarrow} ")
    cy.get('[data-cy="custom-select"]')
      .type(" ")
      .focused()
      .type("{end} ")
    cy.get('[data-cy="custom-select"] input[value="holaamigocomoestas"]')
  })
  it("should not be accessible when disabled", () => {
    cy.get('[data-cy="disabled-select"]')
      .type(" ")
      .focused()
      .should("not.exist")

    cy.get('[data-cy="disabled-select"] [role="option"]').should("not.exist")
  })
})
