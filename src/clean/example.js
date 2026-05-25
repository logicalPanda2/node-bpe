import { __vocab__, __inverse__, tokenize, trainBPE } from "./index.js";

// TINY CORPUS EXAMPLE
const vocab = {...__vocab__};
const inverse = {...__inverse__};
const corpus = "The tall lad and the tall lad.";
const separators = " .";
const merges = 20;

console.log(`Pre-merge: [${tokenize(corpus, separators, vocab).join(", ")}]`);
console.log(trainBPE(corpus, separators, merges, vocab, inverse));
console.log(`Post-merge: [${tokenize(corpus, separators, vocab).join(", ")}]`);
