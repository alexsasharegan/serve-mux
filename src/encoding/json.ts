import { Buffer } from "buffer"
import { Readable } from "stream"

/**
 * Read a stream into JSON.
 * Read limit 0 is unlimited (default).
 */
export function DecodeStream(stream: Readable, maxContentLength: number = 0): Promise<{ [key: string]: any } | any[]> {
  return new Promise((resolve, reject) => {
    let buf: Buffer[] = [],
      len = 0

    stream.on("error", reject)

    stream.on("data", bytes => {
      if (!Buffer.isBuffer(bytes)) {
        bytes = Buffer.from(bytes, "utf8")
      }
      buf.push(bytes)
      len += bytes.length
      if (len > maxContentLength) {
        reject(new RangeError("Parse exceeded max content length."))
      }
    })

    stream.on("end", () => {
      if (len == 0) {
        reject(new TypeError("Cannot parse empty json body."))
      }

      try {
        // Buffer.concat should be called with totalLength to avoid extra loop internally.
        resolve(JSON.parse(Buffer.concat(buf, len).toString()))
      } catch (err) {
        reject(err)
      }
    })
  })
}
