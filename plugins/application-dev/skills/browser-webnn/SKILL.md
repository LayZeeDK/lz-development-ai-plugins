---
name: browser-webnn
title: "Web Neural Network (WebNN) Skill for WebLLM Agents"
version: "1.0.0"
description: >
  Provides WebLLM agents with spec‑compliant reasoning, code generation, and
  ecosystem knowledge for the W3C Web Neural Network API (WebNN). Ensures
  correct use of navigator.ml, MLContext, MLGraphBuilder, and MLTensor for
  on‑device, hardware‑accelerated inference in the browser.
tags:
  - webnn
  - webml
  - on-device-ai
  - browser
  - hardware-acceleration
  - ml-inference
  - w3c-spec
license: "CC0-1.0"
---

# 1. Purpose

This skill enables WebLLM agents to:

- Detect and use the **Web Neural Network API (WebNN)** in browsers.
- Generate **spec‑compliant** JavaScript for on‑device inference.
- Build and execute neural network graphs using `MLGraphBuilder` and `MLContext`.
- Reason about **browser support**, **permissions**, **origin trials**, and **hardware backends** (NPU, GPU, CPU).
- Reference canonical **spec**, **docs**, **GitHub repos**, and **samples**.
- Provide safe, privacy‑preserving guidance for deploying models in the browser.

Aligned with the **W3C WebNN Candidate Recommendation Draft**.

# 2. When This Skill Should Trigger

Trigger this skill when the user:

- Asks about **WebNN API**, operators, semantics, or types.
- Requests **browser‑based, on‑device inference**.
- Mentions **navigator.ml**, **MLContext**, **MLGraphBuilder**, or **MLTensor**.
- Requests **WebNN code snippets**, validation, or troubleshooting.
- Asks about **model conversion** (e.g., ONNX → WebNN).
- Requests **spec references**, **docs**, **GitHub paths**, or **samples**.
- Asks about **browser support**, **origin trials**, or **testing** (WPT).

Do **not** trigger when:
- The environment is **non‑browser** (Node.js, server‑side).
- The user wants **training or fine‑tuning** (WebNN is inference‑only).

# 3. Environment & Prerequisites

- WebNN is available only in **secure contexts (HTTPS)**.
- Entry point is always:

```js
if (!('ml' in navigator)) {
  throw new Error('WebNN is not supported in this browser.');
}
```

- Browser may override device hints for privacy.
- Cross‑origin iframes require the **Permissions Policy**: `allow="ml"`.

# 4. WebNN Programming Model (Spec‑Compliant)

## 4.1 Create a Context

```js
const context = await navigator.ml.createContext({
  deviceTypeHint: 'gpu',        // 'npu' | 'gpu' | 'cpu'
  powerPreference: 'default',   // 'default' | 'high-performance' | 'low-power'
});
```

## 4.2 Build a Graph

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

const conv = builder.conv2d(input, weights);

const graph = await builder.build({ output: conv });
```

## 4.3 Create Tensors & Run Inference

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

const outputData = await context.readTensor(outputTensor);
```

## 4.4 Cleanup

```js
outputTensor.destroy();
inputTensor.destroy();
graph.destroy();
context.destroy();
```

# 5. Core WebNN Interfaces (Normative)

### `navigator.ml`
- Entry point to WebNN.
- `createContext(options): Promise<MLContext>`.

### `MLContext`
- Methods:
  - `dispatch(graph, inputs, outputs)`
  - `createTensor(descriptor)`
  - `createConstantTensor(descriptor)`
  - `readTensor(tensor)`
  - `writeTensor(tensor, data)`
  - `opSupportLimits()`
  - `destroy()`

### `MLGraphBuilder`
- Graph construction.
- Operators include:
  - `matmul`, `conv2d`, `relu`, `softmax`, `gelu`
  - pooling ops
  - `layerNormalization`
  - `concat`
  - `gather`, `scatter`
  - RNN/LSTM/GRU ops

### `MLTensor`
- Runtime tensor for inputs/outputs.
- Supports buffer sharing.

# 6. Hardware Acceleration & Backends

WebNN supports:

- **NPU acceleration** (unique among web APIs)
- **GPU acceleration**
- **CPU fallback**

Backend availability depends on browser implementation (e.g., DirectML on Windows).

# 7. Safety, Privacy & Ethical Constraints

Agents must:

- Prefer **on‑device inference**; avoid suggesting remote upload of sensitive data.
- Never bypass browser security or permissions policy.
- Avoid patterns enabling fingerprinting or timing attacks.
- Encourage transparency for sensitive use cases (face recognition, biometrics).
- Warn that WebNN is **experimental** and browser support varies.

# 8. Best Practices for Generated Code

- Always feature‑detect WebNN.
- Use `async/await`.
- Build graphs **once** and reuse them.
- Separate model loading from graph construction.
- Use `opSupportLimits()` for device‑dependent ops.
- Clean up all tensors, graphs, and contexts.

# 9. Developer Workflows & Ecosystem Guidance

Agents should provide:

### 9.1 Spec‑aligned explanations
- Cite the W3C WebNN spec for normative behavior.

### 9.2 Migration guidance (e.g., ONNX → WebNN)
- Map ONNX ops to WebNN ops.
- Use converters in `webnn-docs` repo.
- Recommend numeric equivalence tests.

### 9.3 Browser support & compatibility
- Mention origin trials, flags, or experimental status.
- Note operator coverage differences across browsers.

### 9.4 Testing
- Recommend Web Platform Tests (WPT).
- Suggest unit tests for shape/dtype correctness.

# 10. Actionable Checklists

## Validate a WebNN snippet
- Confirm secure context.
- Check required flags/origin trials.
- Run small inference test.
- Test across target browsers/devices.
- Review privacy implications.

## Implement ONNX → WebNN operator mapping
- Identify ONNX op and WebNN equivalent.
- Check `webnn-docs` for examples.
- Add conversion logic with dtype/shape tests.
- Run numeric equivalence tests.
- Open PR to `webnn-docs`.

# 11. Example Minimal End‑to‑End Snippet

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

    return await context.readTensor(outputTensor);
  } finally {
    context.destroy();
  }
}
```

# 12. References (Canonical)

- **WebNN Spec (W3C):** [https://www.w3.org/TR/webnn/](https://www.w3.org/TR/webnn/)  
- **Official Docs:** [https://webnn.io/en](https://webnn.io/en)  
- **WebNN Developer Docs:** `https://github.com/webmachinelearning/webnn-docs` [(github.com in Bing)](https://www.bing.com/search?q="https%3A%2F%2Fgithub.com%2Fwebmachinelearning%2Fwebnn-docs")  
- **WebNN Samples:** `https://github.com/webmachinelearning/webnn-samples` [(github.com in Bing)](https://www.bing.com/search?q="https%3A%2F%2Fgithub.com%2Fwebmachinelearning%2Fwebnn-samples")  
- **Core Repo:** `https://github.com/webmachinelearning/webnn` [(github.com in Bing)](https://www.bing.com/search?q="https%3A%2F%2Fgithub.com%2Fwebmachinelearning%2Fwebnn")  

# 13. Confidence

`high` — All normative statements align with the W3C WebNN spec and official documentation.
