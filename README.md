# Teams AI Library V2 Sample

A simple pizza ordering agent vibe'd with [OpenAI Codex Agent](https://chatgpt.com/codex)

![image](https://github.com/user-attachments/assets/eda9afcc-f47e-4447-b439-bce58460fd6e)

# To run
git clone https://github.com/SidU/codex_demo.git
cd codex_demo\codex-agent
npm install & npm run dev

## Reviewing card data

Place your card JSON files in a `cards` folder at the repository root (or pass a custom path to the script). Each file should contain fields `question`, `correctAnswer`, and `aiAnswer`. Run the viewer with:

```bash
node tools/reviewCards.js [path-to-cards]
```

Use `n` and `p` to navigate between cards and `q` to exit.
