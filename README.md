# Byte-Level BPE Attempt

Personal study of the byte-level BPE (Byte Pair Encoding) algorithm used for LLM tokenization. 

The source code in `src/clean` is the clean, modular, but very slow first attempt, training on:
1. **1KB of text** in about **30ms**, resulting in about **90 merges**
2. **10KB of text** in about **700ms**, resulting in about **400 merges**. 

I plan to further iterate on this until it reaches or gets close to a throughput of 1MB/s or 1KB/ms.
