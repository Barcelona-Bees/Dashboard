import { app } from "../appLayer/al.js";

describe("Application layer (Express)", () => {
    test("exports an Express application", () => {
        expect(app).toBeDefined();
        expect(typeof app.get).toBe("function");
        expect(typeof app.listen).toBe("function");
    });
});
