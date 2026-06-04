const { marked } = require('marked');
const md = '```mermaid\nflowchart LR\n A --> B\n```';
console.log(marked.parse(md));
