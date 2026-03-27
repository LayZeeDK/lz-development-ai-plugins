---
name: browser-webnn
version: "1.0.0"
description: >-
  This skill should be used when the Generator agent needs to implement
  on-device neural network inference using the W3C WebNN API. Covers
  navigator.ml feature detection, MLContext creation with NPU/GPU/CPU device
  hints, MLGraphBuilder graph construction, MLTensor dispatch, ONNX-to-WebNN
  operator mapping, and browser compatibility. Trigger when: SPEC.md references
  WebNN, neural network inference, on-device ML, image classification, audio
  processing, NPU acceleration, or ONNX models in the browser. Do NOT trigger
  for LLM chat or text generation (use browser-prompt-api or browser-webllm),
  or for non-browser environments (WebNN is browser-only, inference-only).
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
- Target **NPU**, **GPU**, or **CPU** backends (NPU acceleration is unique among web APIs)
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

- Browser may override device hints for privacy
- Cross-origin iframes require the Permissions Policy: `allow="ml"`
- WebNN is **inference-only** -- no training or fine-tuning

---

## 2. Programming Model

### 2.1 Create a Context

```js
const context = await navigator.ml.createContext({
  deviceTypeHint: 'gpu',        // 'npu' | 'gpu' | 'cpu'
  powerPreference: 'default',   // 'default' | 'high-performance' | 'low-power'
});
```

### 2.2 Build a Graph

```js
const builder = new MLGraphBuilder(context);

const input = builder.input('input', {
  dataType: 'float32',
  dimensions: [1, 3, 224, 224],
});

const weights = builder.constant(
  { dataType: 'float32', dimensions: [3, 3, 3, 3] },
  weightsBuffer,
);

// conv2d with default padding (none) and stride (1)
const conv = builder.conv2d(input, weights);

const graph = await builder.build({ output: conv });
```

### 2.3 Create Tensors and Run Inference

```js
const inputTensor = await context.createTensor({
  dataType: 'float32',
  dimensions: [1, 3, 224, 224],
  data: inputData,
});

const outputTensor = await context.createTensor({
  dataType: 'float32',
  dimensions: [1, 3, 222, 222],
});

await context.dispatch(
  graph,
  { input: inputTensor },
  { output: outputTensor },
);

// readTensor returns an ArrayBuffer -- wrap in the appropriate typed array
const outputData = new Float32Array(await context.readTensor(outputTensor));
```

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
- `dispatch(graph, inputs, outputs)` -- run inference
- `createTensor(descriptor)` -- create runtime tensor
- `createConstantTensor(descriptor)` -- create constant tensor
- `readTensor(tensor)` -- read tensor data (returns `ArrayBuffer`)
- `writeTensor(tensor, data)` -- write data to tensor
- `opSupportLimits()` -- query device-dependent operator support
- `destroy()` -- free resources

### MLGraphBuilder
- Graph construction via operator methods:
  - `matmul`, `conv2d`, `relu`, `softmax`, `gelu`
  - Pooling: `averagePool2d`, `maxPool2d`
  - `layerNormalization`, `batchNormalization`
  - `concat`, `reshape`, `transpose`
  - `gather`, `scatter`
  - RNN/LSTM/GRU ops

### MLTensor
- Runtime tensor for inputs and outputs
- Supports buffer sharing

---

## 4. Hardware Acceleration

WebNN supports:

- **NPU acceleration** -- unique among web APIs, ideal for sustained inference
- **GPU acceleration** -- high throughput for parallel workloads
- **CPU fallback** -- always available

Backend availability depends on browser implementation (e.g., DirectML on Windows, CoreML on macOS).

---

## 5. Best Practices

- Always feature-detect WebNN before using it
- Use `async/await` for all WebNN operations
- Build graphs **once** and reuse them for multiple inferences
- Separate model loading from graph construction
- Use `opSupportLimits()` to check device-dependent operator support
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

## 8. End-to-End Example

```js
async function runWebNNExample(inputData, weightData) {
  if (!('ml' in navigator)) {
    throw new Error('WebNN is not supported in this browser.');
  }

  const context = await navigator.ml.createContext({
    deviceTypeHint: 'gpu',
    powerPreference: 'high-performance',
  });

  try {
    const builder = new MLGraphBuilder(context);

    const input = builder.input('input', {
      dataType: 'float32',
      dimensions: [1, 4],
    });

    const weights = builder.constant(
      { dataType: 'float32', dimensions: [4, 3] },
      weightData,
    );

    const logits = builder.matmul(input, weights);
    const probs = builder.softmax(logits);

    const graph = await builder.build({ output: probs });

    const inputTensor = await context.createTensor({
      dataType: 'float32',
      dimensions: [1, 4],
      data: inputData,
    });

    const outputTensor = await context.createTensor({
      dataType: 'float32',
      dimensions: [1, 3],
    });

    await context.dispatch(
      graph,
      { input: inputTensor },
      { output: outputTensor },
    );

    return new Float32Array(await context.readTensor(outputTensor));
  } finally {
    context.destroy();
  }
}
```

---

## 9. References

- **WebNN Spec (W3C):** https://www.w3.org/TR/webnn/
- **Official Docs:** https://webnn.io/en
- **WebNN Developer Docs:** https://github.com/webmachinelearning/webnn-docs
- **WebNN Samples:** https://github.com/webmachinelearning/webnn-samples
- **Core Repo:** https://github.com/webmachinelearning/webnn
