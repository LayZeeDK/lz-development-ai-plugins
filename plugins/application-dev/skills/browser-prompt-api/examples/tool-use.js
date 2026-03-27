/**
 * Prompt API -- Tool Use Example
 *
 * The LanguageModel API supports tool calling where the browser automatically
 * invokes the execute() callback when the model requests a tool. Multiple
 * tools may be called concurrently.
 *
 * Requirements:
 * - Include 'tool-response' in expectedInputs
 * - Include 'tool-call' in expectedOutputs
 * - Each tool needs: name, description, inputSchema, and async execute()
 */

const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful assistant.' },
  ],
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'tool-response' },
  ],
  expectedOutputs: [
    { type: 'text', languages: ['en'] },
    { type: 'tool-call' },
  ],
  tools: [
    {
      name: 'getWeather',
      description: 'Get the weather in a location.',
      inputSchema: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name.' },
        },
        required: ['location'],
      },
      async execute({ location }) {
        const res = await fetch(
          `https://api.example.com/weather?city=${encodeURIComponent(location)}`
        );
        return JSON.stringify(await res.json());
      },
    },
    {
      name: 'searchProducts',
      description: 'Search for products by query.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query.' },
          limit: { type: 'number', description: 'Max results.' },
        },
        required: ['query'],
      },
      async execute({ query, limit = 5 }) {
        const res = await fetch(
          `/api/products?q=${encodeURIComponent(query)}&limit=${limit}`
        );
        return JSON.stringify(await res.json());
      },
    },
  ],
});

// The browser calls execute() automatically when the model requests a tool.
// The model sees the tool response and incorporates it into its reply.
const result = await session.prompt('What is the weather in Seattle?');
console.log(result);

// Clean up
session.destroy();
