const express = require('express');
const app = express();
app.use(express.json());

app.get('/mcp/manifest', (req, res) => {
  res.json({
    id: "smartling",
    name: "Smartling MCP",
    description: "Access Smartling projects and keys via Smartling API",
    context_types: ["translation_key"],
    params_schema: {
      type: "object",
      properties: {
        account_id: { type: "string" },
        secret: { type: "string" }
      },
      required: ["account_id", "secret"]
    }
  });
});

app.post('/mcp/context', (req, res) => {
  const { context_items } = req.body;
  res.json({
    items: context_items.map(item => ({
      name: item.name,
      description: `🔤 Context for ${item.name} from Smartling`,
      url: "https://dashboard.smartling.com/projects"
    }))
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP server listening on port ${PORT}`);
});
