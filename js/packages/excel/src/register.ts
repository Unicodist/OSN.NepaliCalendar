// Entry point of functions.js, which Excel loads in its custom functions runtime.
import { type Argument, FUNCTIONS, InputError, broadcast } from './functions.js';

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
            const result = run(...(args as Argument[]));
            // Excel passes ranges only to parameters that functions.json declares as matrices, and then
            // expects a matrix back. Office caches functions.json for up to a day, so after an update it
            // can still be using an older version that declares plain values; answer in the shape it asked
            // in, or it waits for a result forever and shows #BUSY!.
            return args.some((arg) => Array.isArray(arg)) ? result : result[0]![0];
        } catch (error) {
            throw toExcelError(error);
        }
    });
}
