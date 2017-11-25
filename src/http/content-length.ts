import { IncomingHttpHeaders } from "http"
import { Status } from "./status"
import { HttpError } from "./error"

let MaxContentLen = 0
let rawMaxLen = process.env.MAX_CONTENT_LENGTH
if (rawMaxLen) {
  MaxContentLen = parseInt(rawMaxLen, 10)
  if (isNaN(MaxContentLen)) {
    throw new TypeError("MAX_CONTENT_LENGTH could not be parsed.")
  }
}

/**
 * VerifyContentLen will return an error if the content length can be parsed and exceeds the limit.
 * The default limit is read from .env `MAX_CONTENT_LENGTH`.
 * A zero limit returns `null` immediately.
 */
export function VerifyContentLen(headers: IncomingHttpHeaders, limit: number = MaxContentLen): HttpError | null {
  if (!limit) {
    return null
  }
  let headerVal = undefined,
    size: number = 0

  if ((headerVal = headers["content-length"])) {
    size = parseInt(headerVal, 10)
  }
  if (size > limit) {
    return NewContentExceededErr()
  }

  return null
}

function NewContentExceededErr(message: string = "Max content length exceeded."): HttpError {
  return new HttpError(Status.RequestEntityTooLarge, message)
}
