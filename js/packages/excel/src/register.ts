// Entry point of functions.js, which Excel loads in its custom functions runtime.
import { FUNCTIONS, InputError } from './functions.js';

declare const CustomFunctions: {
    associate(id: string, fn: (...args: never[]) => unknown): void;
    Error: new (code: string, message?: string) => Error;
    ErrorCode: { invalidValue: string };
};

for (const [id, fn] of Object.entries(FUNCTIONS)) {
    CustomFunctions.associate(id, (...args: never[]) => {
        try {
            return (fn as (...a: never[]) => unknown)(...args);
        } catch (error) {
            if (error instanceof InputError || error instanceof RangeError) {
                throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, error.message);
            }
            throw error;
        }
    });
}
