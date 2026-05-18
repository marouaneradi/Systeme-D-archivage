const fs = require('fs');
const lines = fs.readFileSync('C:/Users/radim/.gemini/antigravity/brain/f35433d5-0b0d-4fbe-82f7-263740cb5ca2/.system_generated/logs/overview.txt', 'utf8').split('\n');
lines.forEach(line => {
  if (line.includes('"step_index":1380') || line.includes('"step_index":1383') || line.includes('"step_index":1368')) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          if (tc.name === 'multi_replace_file_content' || tc.name === 'replace_file_content') {
            const chunksStr = tc.args.ReplacementChunks;
            if (chunksStr) {
                const chunks = JSON.parse(chunksStr);
                chunks.forEach((chunk, i) => {
                  fs.writeFileSync('chunk_' + obj.step_index + '_' + i + '.txt', chunk.ReplacementContent);
                });
            }
          }
        });
      }
    } catch(e) {}
  }
});
