import { render } from "@testing-library/react";
import Page from "./page";

describe("Page", () => {
  it("renders without crashing", () => {
    render(<Page />);
    // Basic test to ensure component renders
    expect(document.body).toBeInTheDocument();
  });
});
