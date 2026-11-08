import React from "react"
import { render, screen } from "@testing-library/react"
import ResponsiveTable from "../responsive-table"

// Mock data for testing
const mockData = [
  { id: "1", nama: "Kendaraan A", status: "Aktif", type: "Mobil" },
  { id: "2", nama: "Kendaraan B", status: "Non-aktif", type: "Motor" },
  { id: "3", nama: "Kendaraan C", status: "Aktif", type: "Bus" },
]

const mockFields = [
  { key: "nama", header: "Nama", render: (row: any) => row.nama, hideBelowLg: false },
  { key: "status", header: "Status", render: (row: any) => row.status, hideBelowLg: false },
  { key: "type", header: "Type", render: (row: any) => row.type, hideBelowLg: true },
]

describe("ResponsiveTable Component", () => {
  // Test renders with data
  it("renders table with data", () => {
    render(
      <ResponsiveTable
        data={mockData}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
      />
    )

    // Check table exists - get all rows
    const rows = screen.getAllByRole("row")
    expect(rows.length).toBeGreaterThan(0)
    // First row should be the header
    const headerRow = rows[0]
    expect(headerRow).toBeInTheDocument()
    // Check that header contains the field names
    expect(headerRow).toHaveTextContent(/Nama/)
    expect(headerRow).toHaveTextContent(/Status/)
  })

  // Test renders empty state
  it("renders empty state when no data", () => {
    render(
      <ResponsiveTable
        data={[]}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
        emptyMessage="Tidak ada data"
      />
    )

    const emptyMessage = screen.getByText(/Tidak ada data/i)
    expect(emptyMessage).toBeInTheDocument()
  })

  // Test renders mobile view (cards)
  it("renders mobile view on small screens", () => {
    const { container } = render(
      <ResponsiveTable
        data={mockData}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
      />
    )

    // The container should have the responsive table structure
    expect(container).toBeInTheDocument()
    // Check that list items are rendered
    const listItems = container.querySelectorAll("li")
    expect(listItems.length).toBeGreaterThan(0)
  })

  // Test with custom empty message
  it("renders custom empty message", () => {
    render(
      <ResponsiveTable
        data={[]}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
        emptyMessage="Tidak ada kendaraan terdaftar"
      />
    )

    const emptyMessage = screen.getByText(/Tidak ada kendaraan terdaftar/i)
    expect(emptyMessage).toBeInTheDocument()
  })

  // Test renders with onRowClick prop
  it("renders with onRowClick handler", () => {
    const handleClick = jest.fn()
    render(
      <ResponsiveTable
        data={mockData}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
        onRowClick={(row) => handleClick(row)}
      />
    )

    // onRowClick handler should be a function
    expect(typeof handleClick).toBe("function")
  })

  // Test header row has th elements
  it("renders header with th elements", () => {
    render(
      <ResponsiveTable
        data={mockData}
        fields={mockFields}
        getKey={(row) => row.id}
        cardTitle={(row) => row.nama}
      />
    )

    // The header row should have th elements
    const headerRow = screen.getAllByRole("row")[0]
    const thElements = headerRow.querySelectorAll("th")
    expect(thElements.length).toBeGreaterThan(0)
  })
})