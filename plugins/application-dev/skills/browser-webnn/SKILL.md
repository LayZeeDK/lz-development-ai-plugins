---
name: browser-webnn
version: "1.1.0"
description: >-
  This skill should be used when the Generator agent needs to implement
  on-device neural network inference using the W3C WebNN API. Covers
  navigator.ml feature detection, MLContext creation with powerPreference
  and accelerated options, MLGraphBuilder graph construction, MLContext
  dispatch with MLTensor inputs/outputs, and browser compatibility.
  Trigger when: SPEC.md references WebNN, neural network inference, on-device
  ML, image classification, audio processing, NPU acceleration, or ONNX models
  in the browser. Do NOT trigger for LLM chat or text generation (use
  browser-built-in-ai or browser-webllm), or for non-browser environments
  (WebNN is browser-only, inference-only).
tags:
  - webnn
  - on-device-ai
  - browser
  - hardware-acceleration
  - ml-inference
  - w3c-spec
license: "CC0-1.0"
---

# Browser WebNN Skill

Spec: https://www.w3.org/TR/webnn/ (W3C Candidate Recommendation Draft)

This skill provides the Generator agent with spec-compliant guidance for the
W3C Web Neural Network API (WebNN) -- on-device, hardware-accelerated neural
network inference in the browser.

- Detect and use `navigator.ml` for creating inference contexts
- Build and execute neural network graphs using `MLGraphBuilder` and `MLContext`
- Target **NPU**, **GPU**, or **CPU** backends via `powerPreference` and `accelerated`
- Reference canonical spec, docs, and samples

---

## 1. Environment and Prerequisites

- WebNN is available only in **secure contexts (HTTPS)**
- Entry point:

```js
if (!('ml' in navigator)) {
  // WebNN is not supported in this browser
  // Disable ML features or fall back to another approach
}
```

- Browser may override device selection for privacy
- Cross-origin iframes require the Permissions Policy: `allow="webnn"`
- WebNN is **inference-only** -- no training or fine-tuning

---

## 2. Programming Model

### 2.1 Create a Context

```js
const context = await navigator.ml.createContext({
  powerPreference: 'high-performance', // 'default' | 'high-performance' | 'low-power'
  accelerated: true,                   // true (GPU/NPU) | false (CPU)
});
```

Device selection uses `powerPreference` and `accelerated` -- there is no
`deviceType` or `deviceTypeHint` option. `powerPreference: 'low-power'` hints
toward NPU, `'high-performance'` hints toward GPU. The browser decides the
actual backend.

### 2.2 Build a Graph

```js
const builder = new MLGraphBuilder(context);

const input = builder.input('input', {
  dataType: 'float32',
  shape: [1, 3, 224, 224],
});

const weights = builder.constant(
  { dataType: 'float32', shape: [3, 3, 3, 3] },
  weightsBuffer, // ArrayBufferView with the weight data
);

// conv2d with default padding (none) and stride (1)
const conv = builder.conv2d(input, weights);

const graph = await builder.build({ output: conv });
```

Note: `MLOperandDescriptor` uses `shape` (not `dimensions`).

### 2.3 Create Tensors and Run Inference

```js
// Create writable input tensor, then write data into it
const inputTensor = await context.createTensor({
  dataType: 'float32',
  shape: [1, 3, 224, 224],
  writable: true,
});
context.writeTensor(inputTensor, inputData); // writeTensor is synchronous

// Create readable output tensor
const outputTensor = await context.createTensor({
  dataType: 'float32',
  shape: [1, 3, 222, 222],
  readable: true,
});

// dispatch() is synchronous (returns undefined) -- it queues the operation
context.dispatch(
  graph,
  { input: inputTensor },
  { output: outputTensor },
);

// readTensor returns a Promise<ArrayBuffer> -- wrap in the appropriate typed array
const outputData = new Float32Array(await context.readTensor(outputTensor));
```

Key points:
- `createTensor` does NOT accept a `data` property -- use `writeTensor()` after creation
- Input tensors need `writable: true`, output tensors need `readable: true`
- `dispatch()` returns `undefined` (not a Promise) -- it queues work on the timeline
- `readTensor()` returns `Promise<ArrayBuffer>` -- the await happens here

### 2.4 Cleanup

```js
outputTensor.destroy();
inputTensor.destroy();
graph.destroy();
context.destroy();
```

---

## 3. Core Interfaces

### navigator.ml
- Entry point to WebNN
- `createContext(options): Promise<MLContext>`

### MLContext
- `dispatch(graph, inputs, outputs)` -- queue inference (returns `undefined`)
- `createTensor(descriptor)` -- create tensor with `readable`/`writable` flags
- `createConstantTensor(descriptor, inputData)` -- create constant tensor with data
- `readTensor(tensor)` -- read tensor data (returns `Promise<ArrayBuffer>`)
- `writeTensor(tensor, data)` -- write data to tensor (returns `undefined`)
- `opSupportLimits()` -- query device-dependent operator support
- `destroy()` -- free resources

### MLGraphBuilder
- Graph construction via operator methods:
  - `matmul`, `conv2d`, `relu`, `softmax`, `gelu`
  - Pooling: `averagePool2d`, `maxPool2d`
  - `layerNormalization`, `batchNormalization`
  - `concat`, `reshape`, `transpose`
  - `gather`, `scatterElements`, `scatterND`
  - RNN/LSTM/GRU ops

### MLTensor
- Runtime tensor for inputs and outputs
- Created with `readable` and/or `writable` flags
- Supports buffer sharing

---

## 4. Hardware Acceleration

WebNN supports:

- **NPU acceleration** -- unique among web APIs, ideal for sustained inference. Hint with `powerPreference: 'low-power'`
- **GPU acceleration** -- high throughput for parallel workloads. Hint with `powerPreference: 'high-performance'`
- **CPU fallback** -- use `accelerated: false`

Backend availability depends on browser implementation (e.g., DirectML on Windows, CoreML on macOS). The browser makes the final device decision.

---

## 5. Best Practices

- Always feature-detect WebNN before using it (`'ml' in navigator`)
- Use `async/await` for `createContext`, `createTensor`, `readTensor`, and `build`
- `dispatch()` is synchronous -- do not await it, await `readTensor()` instead
- Build graphs **once** and reuse them for multiple inferences
- Separate model loading from graph construction
- Use `opSupportLimits()` to check device-dependent operator support
- Set `readable: true` on output tensors, `writable: true` on input tensors
- Clean up all tensors, graphs, and contexts in `finally` blocks
- Prefer on-device inference; avoid suggesting remote upload of sensitive data
- Warn users that WebNN is experimental and browser support varies

---

## 6. ONNX-to-WebNN Migration

- Map ONNX operators to WebNN equivalents
- Use converters in the `webnn-docs` repo
- Run numeric equivalence tests between ONNX and WebNN outputs
- Check `opSupportLimits()` for device-specific operator coverage

---

## 7. Safety and Privacy

- Never bypass browser security or permissions policy
- Avoid patterns enabling fingerprinting or timing attacks
- Encourage transparency for sensitive use cases (face recognition, biometrics)
- Disclose that inference happens on-device

---

## 8. Graceful Degradation Pattern

```js
async function createWebNNContext(powerPreference = 'default') {
  if (!('ml' in navigator)) {
    return null; // WebNN not supported
  }

  try {
    return await navigator.ml.createContext({ powerPreference });
  } catch (err) {
    console.error('Failed to create WebNN context:', err);
    return null;
  }
}

// Usage: ML features enhance the app but are not required
const context = await createWebNNContext('high-performance');
if (context) {
  // Enable ML-powered features (image classification, etc.)
} else {
  // Hide or disable ML features gracefully
}
```

---

## 9. End-to-End Example

```js
async function runWebNNExample(inputData, weightData) {
  if (!('ml' in navigator)) {
    throw new Error('WebNN is not supported in this browser.');
  }

  const context = await navigator.ml.createContext({
    powerPreference: 'high-performance',
  });

  let graph, inputTensor, outputTensor;

  try {
    const builder = new MLGraphBuilder(context);

    const input = builder.input('input', {
      dataType: 'float32',
      shape: [1, 4],
    });

    const weights = builder.constant(
      { dataType: 'float32', shape: [4, 3] },
      weightData,
    );

    const logits = builder.matmul(input, weights);
    const probs = builder.softmax(logits);

    graph = await builder.build({ output: probs });

    inputTensor = await context.createTensor({
      dataType: 'float32',
      shape: [1, 4],
      writable: true,
    });
    context.writeTensor(inputTensor, inputData); // writeTensor is synchronous

    outputTensor = await context.createTensor({
      dataType: 'float32',
      shape: [1, 3],
      readable: true,
    });

    context.dispatch(
      graph,
      { input: inputTensor },
      { output: outputTensor },
    );

    return new Float32Array(await context.readTensor(outputTensor));
  } finally {
    // Clean up all resources
    outputTensor?.destroy();
    inputTensor?.destroy();
    graph?.destroy();
    context.destroy();
  }
}
```

---

## 10. References

- **WebNN Spec (W3C):** https://www.w3.org/TR/webnn/
- **Official Docs:** https://webnn.io/en
- **WebNN Developer Docs:** https://github.com/webmachinelearning/webnn-docs
- **WebNN Samples:** https://github.com/webmachinelearning/webnn-samples
- **Core Repo:** https://github.com/webmachinelearning/webnn
