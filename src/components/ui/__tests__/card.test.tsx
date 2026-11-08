import React from "react"
import { render, screen } from "@testing-library/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../card"

describe("Card Component", () => {
  // Test Card renders correctly
  it("renders card element with base styles", () => {
    render(<Card>Card content</Card>)
    // Get the card by searching in the document
    const cardElement = document.querySelector(".rounded-xl.border.bg-white")
    expect(cardElement).toBeInTheDocument()
  })

  // Test CardHeader renders
  it("renders CardHeader", () => {
    render(<CardHeader>Header title</CardHeader>)
    const header = screen.getByText(/Header title/i)
    expect(header).toBeInTheDocument()
  })

  // Test CardTitle renders
  it("renders CardTitle", () => {
    render(<CardTitle>Card Title</CardTitle>)
    const title = screen.getByText(/Card Title/i)
    expect(title).toBeInTheDocument()
    // Title is an h3 element
    expect(title.tagName).toBe("H3")
  })

  // Test CardDescription renders
  it("renders CardDescription", () => {
    render(<CardDescription>Description text</CardDescription>)
    const description = screen.getByText(/Description text/i)
    expect(description).toBeInTheDocument()
    // Description is a p element
    expect(description.tagName).toBe("P")
  })

  // Test CardContent renders
  it("renders CardContent", () => {
    render(<CardContent>Content here</CardContent>)
    const content = screen.getByText(/Content here/i)
    expect(content).toBeInTheDocument()
  })

  // Test CardFooter renders
  it("renders CardFooter", () => {
    render(<CardFooter>Footer content</CardFooter>)
    const footer = screen.getByText(/Footer content/i)
    expect(footer).toBeInTheDocument()
  })

  // Test Card with custom className
  it("applies custom className", () => {
    render(<Card className="custom-card">Custom content</Card>)
    const card = screen.getByText(/Custom content/i)
    expect(card).toBeInTheDocument()
    // Query the document for the custom class
    const cardElement = document.querySelector(".custom-card")
    expect(cardElement).toBeInTheDocument()
  })

  // Test Card with children components
  it("renders card with child components", () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardTitle>Title</CardTitle>
        <CardDescription>Description</CardDescription>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText(/Header/i)).toBeInTheDocument()
    expect(screen.getByText(/Title/i)).toBeInTheDocument()
    expect(screen.getByText(/Description/i)).toBeInTheDocument()
    expect(screen.getByText(/Content/i)).toBeInTheDocument()
    expect(screen.getByText(/Footer/i)).toBeInTheDocument()
  })
})