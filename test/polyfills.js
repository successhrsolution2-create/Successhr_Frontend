const { TextDecoder, TextEncoder } = require('util')
const { Blob, File } = require('buffer')
const { ReadableStream, TransformStream, WritableStream } = require('stream/web')
const { MessageChannel, MessagePort } = require('worker_threads')

Object.assign(globalThis, {
  Blob,
  File,
  MessageChannel,
  MessagePort,
  ReadableStream,
  TextDecoder,
  TextEncoder,
  TransformStream,
  WritableStream
})

const { fetch, FormData, Headers, Request, Response } = require('undici')

Object.assign(globalThis, {
  fetch,
  FormData,
  Headers,
  Request,
  Response
})

if (!globalThis.BroadcastChannel) {
  globalThis.BroadcastChannel = class BroadcastChannel {
    constructor() {}
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  }
}

if (globalThis.HTMLCanvasElement) {
  Object.defineProperty(globalThis.HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({
      clearRect: () => {},
      fillText: () => {},
      measureText: () => ({ width: 0 })
    })
  })
}
