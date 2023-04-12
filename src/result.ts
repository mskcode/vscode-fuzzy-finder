import { assert, assertIsDefined, assertIsUndefined } from "./assert";
import { Option } from "./option";

export class Result<ValueType, ErrorType = Error | undefined> {
  private readonly valueOrError:
    | { ok: true; value: ValueType }
    | { ok: false; error: ErrorType };

  private constructor(value?: ValueType, error?: ErrorType) {
    if (value) {
      assertIsUndefined(error);
      this.valueOrError = { ok: true, value: value };
    } else {
      assertIsUndefined(value);
      assertIsDefined(error);
      this.valueOrError = { ok: false, error: error };
    }
  }

  public static ofOk<ValueType>(
    value: ValueType
  ): Result<ValueType, undefined> {
    return new Result(value);
  }

  public static ofError<ErrorType = Error>(
    error: ErrorType
  ): Result<undefined, ErrorType> {
    return new Result(undefined, error);
  }

  public isOk(): boolean {
    return this.valueOrError.ok;
  }

  public isError(): boolean {
    return !this.valueOrError.ok;
  }

  public ok(): Option<ValueType> {
    return this.valueOrError.ok
      ? Option.some(this.valueOrError.value)
      : (Option.none() as Option<ValueType>);
  }

  public error(): Option<ErrorType> {
    return !this.valueOrError.ok
      ? Option.some(this.valueOrError.error)
      : (Option.none() as Option<ErrorType>);
  }

  public unwrap(): ValueType {
    assert(this.valueOrError.ok);
    return this.valueOrError.value;
  }

  public unwrapOr(defaultValue: ValueType): ValueType {
    return this.valueOrError.ok ? this.valueOrError.value : defaultValue;
  }

  public unwrapError(): ErrorType {
    assert(!this.valueOrError.ok);
    return this.valueOrError.error;
  }

  public match(matcher: ResultMatcher<ValueType, ErrorType>): void {
    if (this.valueOrError.ok) {
      matcher.ok(this.valueOrError.value);
    } else {
      matcher.error(this.valueOrError.error);
    }
  }
}

export type ResultMatcher<ValueType, ErrorType> = {
  ok: (value: ValueType) => void;
  error: (error: ErrorType) => void;
};
