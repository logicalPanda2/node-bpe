# Byte-Level BPE Attempt

## Description

Personal study of the byte-level BPE (Byte Pair Encoding) algorithm used for LLM tokenization. 

The source code in `src/clean` is the clean, modular, but very slow first attempt, training on:
1. **1KB of text** in about **30ms**, resulting in about **90 merges**
2. **10KB of text** in about **700ms**, resulting in about **400 merges** 

## Final Iteration: Iteration 4

1. Final extrapolated throughput: **0.12KB/ms at scale**
2. Best case: **0.2KB/ms** with warm CPU cache and good merge placements.
