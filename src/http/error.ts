export class HttpError extends Error {
  constructor(public code: number, m: string) {
    super(m)
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}
