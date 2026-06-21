const { TextDecoder, TextEncoder } = require('util')
const { Blob, File } = require('buffer')
const { ReadableStream, TransformStream, WritableStream } = require('stream/web')

class TestMessagePort {
  constructor() {
    this.onmessage = null
    this._target = null
    this._listeners = new Set()
  }

  postMessage(data) {
    const target = this._target
    if (!target) return

    queueMicrotask(() => {
      const event = { data }
      if (typeof target.onmessage === 'function') target.onmessage(event)
      target._listeners.forEach((listener) => listener(event))
    })
  }

  addEventListener(type, listener) {
    if (type === 'message' && typeof listener === 'function') {
      this._listeners.add(listener)
    }
  }

  removeEventListener(type, listener) {
    if (type === 'message') {
      this._listeners.delete(listener)
    }
  }

  start() {}

  close() {
    this.onmessage = null
    this._target = null
    this._listeners.clear()
  }
}

class TestMessageChannel {
  constructor() {
    this.port1 = new TestMessagePort()
    this.port2 = new TestMessagePort()
    this.port1._target = this.port2
    this.port2._target = this.port1
  }
}

Object.assign(globalThis, {
  Blob,
  File,
  MessageChannel: TestMessageChannel,
  MessagePort: TestMessagePort,
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
