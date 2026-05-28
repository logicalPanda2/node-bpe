# node-bpe

A library for the byte-level BPE algorithm used to train LLM vocabularies, and a MaxMatch tokenization algorithm, implemented in Node.js with no external dependencies.

## Installation

```
git clone https://github.com/logicalPanda2/node-bpe
```

## Usage

The full script below is available in `./example.js`.
```js
import nodeBPE from "./src/index.js";
import tokenize from "./src/tokenizer.js";

const corpus = "The old wizard lived in a tall tower ..."; // full corpus in ./example.js
const merges = 128;
const separators = nodeBPE.defaultSeparators;
const vocabulary = {...nodeBPE.utf8EncodeTable128Entries};
const inverse = {...nodeBPE.utf8DecodeTable128Entries};
const entries = nodeBPE.defaultEntries;

const { tokens_learned, merges_done, time_taken } = nodeBPE.train({ 
    corpus: corpus,
    merges: merges,
    separators: separators,
    encodeTable: vocabulary,
    decodeTable: inverse,
    totalEntries: entries,
});

for(const [string, token] of tokens_learned) {
    console.log(`${token}: \`${string}\``);
}
console.log(`------------------------------`);
console.log(`Merges done: ${merges_done}`);
console.log(`Time taken ${time_taken}`);

console.log("");

const str = "The old wizard";
const tokens = tokenize(str, vocabulary);
console.log(`Source string: "The old wizard"\nTokens: [${tokens.join(", ")}]`);
```

## Algorithms

### BPE Algorithm

Standard byte-level BPE implementation with:
- Linked lists for fast merging
- Merged pair hashmap + frequency count
- Unique-word optimization for fast tokenization

The extrapolated throughput at scale is **0.12MB/s**.

### MaxMatch Algorithm

Simple longest-prefix approach; Chosen over classic BPE for practical reasons.

### License

MIT
