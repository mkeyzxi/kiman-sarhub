import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input, Textarea, Select, Label } from "../input";

describe("Input Component", () => {
  // ─── Basic rendering ─────────────────────────────────────────────────────

  it("renders text input by default", () => {
    const { container } = render(<Input placeholder="Nama" />);
    const input = container.querySelector("input")!;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Nama");
  });

  it("renders type='time' input", () => {
    const { container } = render(<Input type="time" id="jamBerangkat" />);
    const input = container.querySelector("input")!;
    expect(input).toHaveAttribute("type", "time");
    expect(input).toHaveAttribute("id", "jamBerangkat");
  });

  it("renders type='number' input", () => {
    render(<Input type="number" id="bbm" min={0} max={100} />);
    const input = screen.getByRole("spinbutton");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
  });

  it("applies custom className", () => {
    const { container } = render(<Input className="border-red-300" />);
    const input = container.querySelector("input")!;
    expect(input).toHaveClass("border-red-300");
  });

  it("applies disabled state", () => {
    const { container } = render(<Input disabled />);
    const input = container.querySelector("input")!;
    expect(input).toBeDisabled();
  });

  // ─── Time input specific (jam keberangkatan / jam kembali) ──────────────

  /**
   * jsdom limitation: `fireEvent.change` on type="time" inputs does not
   * reliably update `e.target.value` in the synthetic event after React's
   * event cycle completes. Instead we use a value-capturing handler to
   * verify the value was passed correctly at dispatch time.
   */
  function valueSpy(onChange: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  }

  it("time input 'jamBerangkat' onChange receives '08:00'", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="time"
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        id="jamBerangkat"
        aria-label="Jam Berangkat"
      />
    );
    const input = container.querySelector("input")!;

    fireEvent.change(input, { target: { value: "08:00" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("08:00");
  });

  it("time input 'jamKembali' onChange receives '10:30'", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="time"
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        aria-label="Jam Kembali"
      />
    );
    const input = container.querySelector("input")!;

    fireEvent.change(input, { target: { value: "10:30" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("10:30");
  });

  it("time input fires onChange for a sequence of valid times", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="time"
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        aria-label="Jam Berangkat"
      />
    );
    const input = container.querySelector("input")!;

    fireEvent.change(input, { target: { value: "07:00" } });
    fireEvent.change(input, { target: { value: "07:30" } });
    fireEvent.change(input, { target: { value: "23:59" } });

    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith("23:59");
  });

  it("controlled time input reflects value prop", () => {
    const { container } = render(
      <Input type="time" value="07:30" onChange={() => {}} aria-label="Jam Berangkat" />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("07:30");
  });

  it("controlled time input with empty value shows empty", () => {
    const { container } = render(
      <Input type="time" value="" onChange={() => {}} aria-label="Jam Kembali" />
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  // ─── Number input (bbm, km) ──────────────────────────────────────────────

  it("number input for bbm percent fires onChange with '75'", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="number"
        min={0}
        max={100}
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        placeholder="Contoh: 75"
        aria-label="BBM Sesudah"
      />
    );
    const input = container.querySelector("input")!;

    fireEvent.change(input, { target: { value: "75" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("75");
  });

  it("number input for km fires onChange with '45312'", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="number"
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        aria-label="Km Sesudah"
      />
    );
    const input = container.querySelector("input")!;

    fireEvent.change(input, { target: { value: "45312" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("45312");
  });

  // ─── onChange handler fires on every keystroke ───────────────────────────

  it("fires onChange on each keystroke for text input", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <Input
        type="text"
        value=""
        onChange={(e) => valueSpy(handleChange)(e)}
        aria-label="Rute"
      />
    );
    const input = container.querySelector("input")!;

    // Simulate individual character changes
    fireEvent.change(input, { target: { value: "A" } });
    fireEvent.change(input, { target: { value: "AB" } });

    expect(handleChange).toHaveBeenCalledTimes(2);
    expect(handleChange).toHaveBeenLastCalledWith("AB");
  });

  // ─── Form pattern: setField pattern used in logbook form ────────────────

  describe("setField pattern (mirrors logbook form behavior)", () => {
    function TestForm() {
      const [form, setForm] = React.useState({
        jamBerangkat: "",
        jamKembali: "",
      });

      const setField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
      };

      return (
        <div>
          <label htmlFor="jamBerangkat-test">Jam Berangkat</label>
          <input
            id="jamBerangkat-test"
            type="time"
            value={form.jamBerangkat}
            onChange={(e) => setField("jamBerangkat", e.target.value)}
          />
          <label htmlFor="jamKembali-test">Jam Kembali</label>
          <input
            id="jamKembali-test"
            type="time"
            value={form.jamKembali}
            onChange={(e) => setField("jamKembali", e.target.value)}
          />
          <p data-testid="jamBerangkat-value">{form.jamBerangkat || "(empty)"}</p>
          <p data-testid="jamKembali-value">{form.jamKembali || "(empty)"}</p>
        </div>
      );
    }

    it("jamBerangkat state updates on user input", () => {
      render(<TestForm />);
      const jamBerangkatInput = screen.getByLabelText("Jam Berangkat");

      fireEvent.change(jamBerangkatInput, { target: { value: "08:00" } });

      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("08:00");
      // jamKembali should remain empty
      expect(screen.getByTestId("jamKembali-value")).toHaveTextContent("(empty)");
    });

    it("jamKembali state updates on user input", () => {
      render(<TestForm />);
      const jamKembaliInput = screen.getByLabelText("Jam Kembali");

      fireEvent.change(jamKembaliInput, { target: { value: "10:30" } });

      expect(screen.getByTestId("jamKembali-value")).toHaveTextContent("10:30");
      // jamBerangkat should remain empty
      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("(empty)");
    });

    it("changing jamBerangkat does not affect jamKembali state", () => {
      render(<TestForm />);
      const jamKembaliInput = screen.getByLabelText("Jam Kembali");
      const jamBerangkatInput = screen.getByLabelText("Jam Berangkat");

      // Set jamKembali first
      fireEvent.change(jamKembaliInput, { target: { value: "12:00" } });
      // Then set jamBerangkat
      fireEvent.change(jamBerangkatInput, { target: { value: "09:00" } });

      // Both should reflect their respective values
      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("09:00");
      expect(screen.getByTestId("jamKembali-value")).toHaveTextContent("12:00");
    });

    it("initial state is empty for both fields", () => {
      render(<TestForm />);
      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("(empty)");
      expect(screen.getByTestId("jamKembali-value")).toHaveTextContent("(empty)");
    });

    it("setting jamBerangkat to empty after it was set clears state", () => {
      render(<TestForm />);
      const jamBerangkatInput = screen.getByLabelText("Jam Berangkat");

      // Set it first
      fireEvent.change(jamBerangkatInput, { target: { value: "08:00" } });
      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("08:00");

      // Clear it
      fireEvent.change(jamBerangkatInput, { target: { value: "" } });
      expect(screen.getByTestId("jamBerangkat-value")).toHaveTextContent("(empty)");
    });
  });

  // ─── Textarea ────────────────────────────────────────────────────────────

  it("renders textarea", () => {
    render(<Textarea placeholder="Catatan" rows={3} aria-label="Catatan" />);
    const textarea = screen.getByLabelText("Catatan");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("rows", "3");
    expect(textarea).toHaveAttribute("placeholder", "Catatan");
  });

  it("textarea controlled value", () => {
    render(<Textarea value="Catatan lama" onChange={() => {}} aria-label="Catatan" />);
    const textarea = screen.getByLabelText("Catatan") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Catatan lama");
  });

  it("textarea fires onChange on input", () => {
    const handleChange = jest.fn();
    render(
      <Textarea
        value=""
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Catatan"
      />
    );
    const textarea = screen.getByLabelText("Catatan");

    fireEvent.change(textarea, { target: { value: "Kondisi normal" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("Kondisi normal");
  });

  // ─── Select ──────────────────────────────────────────────────────────────

  it("renders select with options", () => {
    render(
      <Select aria-label="Kategori">
        <option value="RIB">RIB</option>
        <option value="Kapal">Kapal</option>
        <option value="Mobil">Mobil</option>
        <option value="Motor">Motor</option>
      </Select>
    );
    const select = screen.getByRole("combobox", { name: /kategori/i });
    expect(select).toBeInTheDocument();
  });

  it("select controlled value", () => {
    render(
      <Select value="Mobil" onChange={() => {}} aria-label="Kategori">
        <option value="RIB">RIB</option>
        <option value="Kapal">Kapal</option>
        <option value="Mobil">Mobil</option>
        <option value="Motor">Motor</option>
      </Select>
    );
    const select = screen.getByRole("combobox", { name: /kategori/i }) as HTMLSelectElement;
    expect(select.value).toBe("Mobil");
  });

  it("select fires onChange when value changes", () => {
    const handleChange = jest.fn();
    render(
      <Select
        value=""
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Kategori"
      >
        <option value="">Pilih kategori</option>
        <option value="RIB">RIB</option>
        <option value="Kapal">Kapal</option>
        <option value="Mobil">Mobil</option>
      </Select>
    );
    const select = screen.getByRole("combobox", { name: /kategori/i }) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "RIB" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("RIB");
  });

  // ─── Label ───────────────────────────────────────────────────────────────

  it("renders label with text", () => {
    render(<Label htmlFor="test">Test Label</Label>);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  it("label associated with input via htmlFor", () => {
    const { container } = render(
      <>
        <Label htmlFor="jamBerangkat-label-test">Jam Berangkat</Label>
        <Input
          id="jamBerangkat-label-test"
          aria-label="Jam Berangkat"
          value=""
          onChange={() => {}}
        />
      </>
    );
    const label = container.querySelector("label")!;
    expect(label).toHaveAttribute("for", "jamBerangkat-label-test");
  });
});
