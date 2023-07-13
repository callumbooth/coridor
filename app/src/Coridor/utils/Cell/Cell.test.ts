import Cell from "./Cell";

describe("Cell", () => {
  it("should create a cell", () => {
    const cell = new Cell(1, 2);

    expect(cell.row).toBe(1);
    expect(cell.col).toBe(2);
  });

  it("should get the fCost", () => {
    const cell = new Cell(1, 2);

    cell.gCost = 10
    cell.hCost = 12

    expect(cell.fCost).toBe(22)
  });
});
