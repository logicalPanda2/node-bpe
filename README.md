# Byte-Level BPE Attempt

## Description

Personal study of the byte-level BPE (Byte Pair Encoding) algorithm used for LLM tokenization. 

The source code in `src/clean` is the clean, modular, but very slow first attempt, training on:
1. **1KB of text** in about **30ms**, resulting in about **90 merges**
2. **10KB of text** in about **700ms**, resulting in about **400 merges** 

I plan to further iterate on this until it reaches or gets close to a throughput of 1MB/s or 1KB/ms.

## Performance

1. `src/optimized/iteration-4.js`:
    - rough measurement of **8KB/40ms** and **20KB/178ms**
    - resulting in **~300 merges** and **~900 merges** respectively
2. Estimated throughput: **0.12KB/ms**, at scale
3. Required performance boost to reach 1KB/ms: **8.5x**
