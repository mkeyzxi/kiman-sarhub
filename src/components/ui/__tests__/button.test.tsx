import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Button } from "../button"

describe("Button Component", () => {
  // Test basic rendering with default props
  it("renders with default props", () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass("inline-flex")
    expect(button).toHaveClass("items-center")
  })

  // Test primary variant
  it("renders with primary variant", () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByRole("button", { name: /primary/i })
    expect(button).toHaveClass("bg-primary")
    expect(button).toHaveClass("text-white")
  })

  // Test secondary variant
  it("renders with secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByRole("button", { name: /secondary/i })
    expect(button).toHaveClass("bg-slate-100")
    expect(button).toHaveClass("text-slate-800")
  })

  // Test outline variant
  it("renders with outline variant", () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole("button", { name: /outline/i })
    expect(button).toHaveClass("border")
    expect(button).toHaveClass("border-slate-200")
  })

  // Test ghost variant
  it("renders with ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>)
    const button = screen.getByRole("button", { name: /ghost/i })
    expect(button).toHaveClass("text-slate-600")
  })

  // Test danger variant
  it("renders with danger variant", () => {
    render(<Button variant="danger">Danger</Button>)
    const button = screen.getByRole("button", { name: /danger/i })
    expect(button).toHaveClass("bg-rose-600")
    expect(button).toHaveClass("text-white")
  })

  // Test size sm
  it("renders with size sm", () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByRole("button", { name: /small/i })
    expect(button).toHaveClass("h-8")
    expect(button).toHaveClass("text-xs")
  })

  // Test size md (default)
  it("renders with size md", () => {
    render(<Button size="md">Medium</Button>)
    const button = screen.getByRole("button", { name: /medium/i })
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("py-2")
  })

  // Test size lg
  it("renders with size lg", () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole("button", { name: /large/i })
    expect(button).toHaveClass("h-12")
    expect(button).toHaveClass("text-base")
  })

  // Test size icon
  it("renders with size icon", () => {
    render(<Button size="icon">Icon</Button>)
    const button = screen.getByRole("button", { name: /icon/i })
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("w-10")
  })

  // Test size icon-sm
  it("renders with size icon-sm", () => {
    render(<Button size="icon-sm">Icon SM</Button>)
    const button = screen.getByRole("button", { name: /icon sm/i })
    expect(button).toHaveClass("h-8")
    expect(button).toHaveClass("w-8")
  })

  // Test disabled state
  it("renders with disabled state", () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole("button", { name: /disabled/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass("disabled:pointer-events-none")
    expect(button).toHaveClass("disabled:opacity-50")
  })

  // Test custom className
  it("applies custom className", () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByRole("button", { name: /custom/i })
    expect(button).toHaveClass("custom-class")
  })

  // Test with icon
  it("renders with leading icon", () => {
    render(
      <Button variant="primary">
        <svg data-testid="icon" aria-hidden="true" />
        Icon Button
      </Button>
    )
    const button = screen.getByRole("button", {
      name: /icon button/i,
    })
    expect(button).toBeInTheDocument()
  })

  // Test onClick handler
  it("calls onClick handler", () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // Test onClick handler with userEvent
  it("calls onClick handler with userEvent", async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole("button", { name: /click me/i })
    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  // Test disabled attribute when disabled
  it("sets disabled attribute when disabled", () => {
    render(<Button disabled>Aria Test</Button>)
    const button = screen.getByRole("button", { name: /aria test/i })
    expect(button).toHaveAttribute("disabled")
  })

  // Test default variant is primary
  it("uses primary variant by default", () => {
    render(<Button>Default Variant</Button>)
    const button = screen.getByRole("button", { name: /default variant/i })
    expect(button).toHaveClass("bg-primary")
    expect(button).toHaveClass("text-white")
  })

  // Test default size is md
  it("uses md size by default", () => {
    render(<Button>Default Size</Button>)
    const button = screen.getByRole("button", { name: /default size/i })
    expect(button).toHaveClass("h-10")
    expect(button).toHaveClass("py-2")
  })
})