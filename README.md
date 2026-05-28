# node-bpe

A library for the byte-level BPE algorithm for training LLM vocabularies and a MaxMatch tokenization algorithm, implemented in Node.js with no external dependencies.

## Installation

```
git clone https://github.com/logicalPanda2/node-bpe
```

## Usage

Added later

## Algorithms

### BPE Algorithm

Standard byte-level BPE implementation with:
- Linked lists for fast merging
- Merged pair hashmap + frequency count
- Unique-word optimization for fast tokenization

The extrapolated throughput at scale is **0.12MB/s**.

### MaxMatch Algorithm

Simple longest-prefix approach; Chosen over classic BPE because of practical purposes.

### License

MIT
