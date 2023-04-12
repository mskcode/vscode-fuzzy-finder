/**
 * Yoinked from Node's assert.d.js since browser environments don't have
 * native assert functionality.
 *
 * Node's Error implementation has `code` property that browsers don't have.
 */
export class AssertionError extends Error {
  actual: unknown;
  expected: unknown;
  operator: string;
  generatedMessage: boolean;
  //code: string; // "ERR_ASSERTION"

  constructor(options?: {
    /** If provided, the error message is set to this value. */
    message?: string | undefined;
    /** The `actual` property on the error instance. */
    actual?: unknown | undefined;
    /** The `expected` property on the error instance. */
    expected?: unknown | undefined;
    /** The `operator` property on the error instance. */
    operator?: string | undefined;
    /** If provided, the generated stack trace omits frames before this function. */
    // tslint:disable-next-line:ban-types
    stackStartFn?: Function | undefined;
  }) {
    super(options?.message);
    this.actual = options?.actual;
    this.expected = options?.expected;
    this.operator = options?.operator ?? "";
    this.generatedMessage = false;
  }
}

export function assert(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) {
    const errorMessage = message ?? "Assertion failed";
    throw new AssertionError({ message: errorMessage });
  }
}

export function assertIsUndefined(obj?: any): asserts obj is undefined | null {
  assert(obj === undefined || obj === null, "obj !== undefined | null");
}

export function assertIsDefined<T>(obj?: T): asserts obj is NonNullable<T> {
  assert(obj !== undefined && obj !== null, "obj === undefined | null");
}
