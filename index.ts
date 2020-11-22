export type CustomValidator = (x: unknown) => x is any;

export declare function validate<T>(
  jsonObj: any,
  customValidators?: CustomValidator[]
): T;
