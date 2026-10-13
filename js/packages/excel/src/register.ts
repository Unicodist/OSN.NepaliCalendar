// Entry point of functions.js, which Excel loads in its custom functions runtime.
import { FUNCTIONS, InputError, RANGE_FUNCTIONS, overRange } from './functions.js';

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

for (const [id, fn] of Object.entries(FUNCTIONS)) {
    const scalar = fn as (...args: unknown[]) => unknown;
    const impl = RANGE_FUNCTIONS.has(id as keyof typeof FUNCTIONS) ? overRange(scalar, toExcelError) : scalar;
    CustomFunctions.associate(id, (...args: never[]) => {
        try {
            return (impl as (...a: never[]) => unknown)(...args);
        } catch (error) {
            throw toExcelError(error);
        }
    });
}
