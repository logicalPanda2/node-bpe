import nodeBPE from "./src/index.js";
import { saveToFileOverwrite } from "./src/index.js";
import tokenize from "./src/tokenizer.js";

const corpus = "The old wizard lived in a tall tower at the edge of a dark forest. Every morning, the wizard would walk through the dark trees, collecting herbs and muttering old spells under his breath. The forest was full of strange sounds, but the wizard never felt afraid. He had walked these paths for so long that every dark corner felt like home. One day, a young traveler came to the tower seeking the old wizard's help. The traveler had walked for many days through rain and cold, and was desperate for guidance. The wizard listened carefully, then smiled and said that the forest holds many answers for those who walk slowly and observe. The traveler thanked the wizard and walked back into the forest, feeling hopeful for the first time in many days.";
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

// Optionally save the result:
// await saveToFileOverwrite("./vocab.json", vocabulary);
