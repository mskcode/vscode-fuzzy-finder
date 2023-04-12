import { assertIsDefined } from "./assert";

export class Option<ValueType> {
  private value: ValueType | undefined;

  private constructor(value: ValueType | undefined) {
    this.value = value;
  }

  public static some<ValueType>(value: ValueType): Option<ValueType> {
    assertIsDefined(value);
    return new Option(value);
  }

  public static none(): Option<undefined> {
    return new Option(undefined);
  }

  public static maybe<ValueType>(value?: ValueType): Option<ValueType> {
    return value ? Option.some(value) : (Option.none() as Option<ValueType>);
  }

  public map<U>(f: (value: ValueType) => U): Option<U> {
    return this.value
      ? Option.some(f(this.value))
      : (Option.none() as Option<U>);
  }

  public unwrap(): ValueType {
    assertIsDefined(this.value);
    return this.value;
  }
}
