// Entry point of functions.js, which Excel loads in its custom functions runtime.
import { FUNCTIONS, InputError, broadcast } from './functions.js';

declare const CustomFunctions: {
    associate(id: string, fn: (...args: never[]) => unknown): void;
    Error: new (code: string, message?: string) => Error;
    ErrorCode: { invalidValue: string };
};

function toExcelError(error: unknown): unknown {
    if (error instanceof InputError || error instanceof RangeError) {
        return new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, error.message);
    }
    return error;
}

for (const [id, { fn, values }] of Object.entries(FUNCTIONS)) {
    const run = broadcast(fn, values, toExcelError);
    CustomFunctions.associate(id, (...args: never[]) => {
        try {
            return run(...args);
        } catch (error) {
            throw toExcelError(error);
        }
    });
}
