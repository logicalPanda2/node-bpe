// 1. Current iteration: ITERATION 4
// 2. Description: 
//      Uses a linked list + map of frequency table and node pointers.
//      This iteration is:
//          a. slightly superior to ITERATION 3 in optimization,
//          b. and superior in logic.
//      All unnecessary functions/logic are removed in this iteration.
//      The precision and brevity of comments is greatly improved.
// 3. Benchmark samples:
//      92 merges at 1KB/8ms = 0.12KB/ms
//      300 merges at 8KB/40ms = 0.2KB/ms
//      900 merges at 20KB/178ms = 0.11KB/ms
// 4. Extrapolated throughput: 0.12KB/ms at scale 
// 5. Potential areas of improvement:
//      Batch merging
//      Priority queues

export class Node {
    constructor(value, id, prev = null, next = null) {
        this.value = value;
        this.prev = prev;
        this.next = next;
    }

    insert(node) {
        node.next = this.next;                  // B.next = C
        node.prev = this;                       // B.prev = A
        if(this.next)                           // ensure C is not null
            this.next.prev = node;              // C.prev = B
        this.next = node;                       // A.next = B
    }

    redirect() {
        const rightPtr = this.next;
        this.next = this.next?.next ?? null     // A.next = C || null
        if(this.next)                           // ensure C is not null
            this.next.prev = this;              // C.prev = A
        
        // additional ghost node safeguards
        if(rightPtr) {
            rightPtr.next = null;
            rightPtr.prev = null;
        }
    }
}

export class DoublyLinkedList {
    constructor(...values) {
        const start = new Node(values[0]);
        for(let i = values.length - 1; i > 0; i--) {
            start.insert(
                new Node(values[i])
            );
        }

        this.start = start;
    }
}

function strpbrk(src, separators) {
    for(let i = 1; i < src.length; i++) {
        for(let j = 0; j < separators.length; j++) {
            if(src[i] === separators[j]) return i;
        }
    }

    return src.length;
}

function trainBPE(corpus, separators, merges, vocab, inverse, totalVocabEntries) {
    let VOCAB_SIZE = totalVocabEntries;

    // PSEUDO REGEX CHUNKING
    // separate the corpus into chunks based on the given separators
    // separators are merged into the next chunk if a next chunk exists
    // each chunk in the final chunks array is unique
    const chunks = [];
    const chunkFrequencies = {};
    while(corpus.length > 1) {
        const breakpoint = strpbrk(corpus, separators);
        const chunk = corpus.slice(0, breakpoint);

        if(!chunkFrequencies[chunk]) {
            chunks.push(chunk);
            chunkFrequencies[chunk] = 1;
        } else {
            chunkFrequencies[chunk]++;
        }

        corpus = corpus.slice(breakpoint);
    }

    if(!chunkFrequencies[corpus]) {
        chunks.push(corpus);
        chunkFrequencies[corpus] = 1;
    } else {
        chunkFrequencies[corpus]++;
    }
    
    // PSEUDO BPE TOKENIZATION
    // each chunk is tokenized based on the current vocabulary
    // this is more similar to MaxMatch, but it suffices temporarily
    const tokens = [];
    for(let i = 0; i < chunks.length; i++) {
        if(tokens[i] === undefined) tokens.push([]);

        for(let j = chunks[i].length; j > 0; j--) {
            const substring = chunks[i].slice(0, j);
            if(vocab[substring]) {
                tokens[i].push(vocab[substring]);
                chunks[i] = chunks[i].slice(j);

                i--;
                break;
            }
        }
    }

    // LINKED LIST TRANSFORMATION
    // transform all tokenized chunks with into a doubly linked list
    // keep standalone tokens for easy access to chunk frequencies 
    // and to preserve invariant of chunk.length === tokens.length
    for(let i = 0; i < tokens.length; i++) {
        tokens[i] = new DoublyLinkedList(...tokens[i]);
    }

    // INITIAL PAIR COUNTING
    // within the bounds of each sublist,
    // count all overlapping n - 1 pairs within that list,
    // and store pointers to the start of each pair.
    // there is an invariant where the token length is the same as chunk length,
    // therefore multiply the amount of times a pair appears by however many times
    // the chunk appears in the corpus, and store the chunk positions for future use.
    const pairs = {};
    // micro-optimization: 
    // Object.values() is faster than keeping a separate index lookup and an array
    const chunkFreqArr = Object.values(chunkFrequencies);
    for(let i = 0; i < tokens.length; i++) {
        let node = tokens[i].start;
        while(node.next !== null) {
            const pair = [node.value, node.next.value];
            if(!pairs[pair]) {
                pairs[pair] = {
                    0: { node: node, chunkId: i },
                    nextId: 1,
                    frequencies: chunkFreqArr[i],
                };
            } else {
                pairs[pair][pairs[pair].nextId++] = { node: node, chunkId: i };
                pairs[pair].frequencies += chunkFreqArr[i];
            }

            node = node.next;
        }
    }
    
    for(let i = 0; i < merges; i++) {
        // MOST FREQUENT PAIR
        // compute the key and frequency of the most frequent pair
        let key = null;
        let maxFrequencies = 0;
        for(const p in pairs) {
            if(pairs[p].frequencies > maxFrequencies) {
                key = p;
                maxFrequencies = pairs[p].frequencies;
            }
        }

        // if max frequent pair occurs less than twice, there is no more relevant merges. 
        // micro-optimization: <= 1 works better than < 2 for some reason
        if(maxFrequencies <= 1)
            break;

        // REGISTER THE NEW TOKEN
        // process the tokenized pair and register it in vocab and inverse
        const keyString = key.split(",").map(c => inverse[c]).join("");
        vocab[keyString] = VOCAB_SIZE;
        inverse[VOCAB_SIZE] = keyString;

        const pair = pairs[key];
        let x = 0;
        for(let x = 0; x < pair.nextId; x++) {
            if(!pair[x])
                continue;

            // micro-optimization: storing pair[x] makes hot loop faster,
            // most likely because of less dereferencing in property access
            const currentPair = pair[x];

            // decrement neighboring old pairs, delete stale pairs
            const oldLeftPairKey = [
                currentPair.node.prev?.value,
                currentPair.node.value
            ];
            const oldLeftPair = pairs[oldLeftPairKey];
            const oldRightPairKey = [
                currentPair.node.next?.value,
                currentPair.node.next?.next?.value
            ];
            const oldRightPair = pairs[oldRightPairKey];
            if(oldLeftPair) {
                oldLeftPair.frequencies -=
                    chunkFreqArr[currentPair.chunkId];
                
                for(let z = 0; z < oldLeftPair.nextId; z++) {
                    if(!oldLeftPair[z])
                        continue;

                    if(oldLeftPair[z].node?.next === currentPair.node)
                        delete oldLeftPair[z];
                }
            }
            if(oldRightPair) {
                oldRightPair.frequencies -=
                    chunkFreqArr[currentPair.chunkId];
                
                for(let z = 0; z < oldRightPair.nextId; z++) {
                    if(!oldRightPair[z])
                        continue;

                    if(oldRightPair[z].node?.prev === currentPair.node?.next)
                        delete oldRightPair[z];
                }
            }

            // mutate node value and skip past the right node
            currentPair.node.value = VOCAB_SIZE;
            currentPair.node.redirect();

            // create/increment new pairs
            const newLeftPairKey = [
                currentPair.node.prev?.value,
                currentPair.node.value
            ];
            const newRightPairKey = [
                currentPair.node.value,
                currentPair.node.next?.value
            ];
            if(newLeftPairKey[0]) {
                if(!pairs[newLeftPairKey]) {
                    pairs[newLeftPairKey] = {
                        0: { node: currentPair.node.prev, chunkId: currentPair.chunkId },
                        nextId: 1,
                        frequencies: chunkFreqArr[currentPair.chunkId],
                    }
                } else {
                    pairs[newLeftPairKey][pairs[newLeftPairKey].nextId++] = 
                        { node: currentPair.node.prev, chunkId: currentPair.chunkId };
                    pairs[newLeftPairKey].frequencies += chunkFreqArr[currentPair.chunkId];
                }
            }
            if(newRightPairKey[1]) {
                if(!pairs[newRightPairKey]) {
                    pairs[newRightPairKey] = {
                        0: { node: currentPair.node, chunkId: currentPair.chunkId },
                        nextId: 1,
                        frequencies: chunkFreqArr[currentPair.chunkId],
                    }
                } else {
                    pairs[newRightPairKey][pairs[newRightPairKey].nextId++] = 
                        { node: currentPair.node, chunkId: currentPair.chunkId };
                    pairs[newRightPairKey].frequencies += chunkFreqArr[currentPair.chunkId];
                }
            }
        }

        // delete mutated pair and increment vocab_size for next entry
        delete pairs[key];
        VOCAB_SIZE++;
    }

    return {
        merges: VOCAB_SIZE - totalVocabEntries,
        learned: Object.entries(vocab).slice(totalVocabEntries),
    }
}

const vocab = {
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    '\x00': 0,
    '\x01': 1,
    '\x02': 2,
    '\x03': 3,
    '\x04': 4,
    '\x05': 5,
    '\x06': 6,
    '\x07': 7,
    '\b': 8,
    '\t': 9,
    '\n': 10,
    '\x0B': 11,
    '\f': 12,
    '\r': 13,
    '\x0E': 14,
    '\x0F': 15,
    '\x10': 16,
    '\x11': 17,
    '\x12': 18,
    '\x13': 19,
    '\x14': 20,
    '\x15': 21,
    '\x16': 22,
    '\x17': 23,
    '\x18': 24,
    '\x19': 25,
    '\x1A': 26,
    '\x1B': 27,
    '\x1C': 28,
    '\x1D': 29,
    '\x1E': 30,
    '\x1F': 31,
    ' ': 32,
    '!': 33,
    '"': 34,
    '#': 35,
    '$': 36,
    '%': 37,
    '&': 38,
    "'": 39,
    '(': 40,
    ')': 41,
    '*': 42,
    '+': 43,
    ',': 44,
    '-': 45,
    '.': 46,
    '/': 47,
    ':': 58,
    ';': 59,
    '<': 60,
    '=': 61,
    '>': 62,
    '?': 63,
    '@': 64,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    '[': 91,
    '\\': 92,
    ']': 93,
    '^': 94,
    _: 95,
    '`': 96,
    a: 97,
    b: 98,
    c: 99,
    d: 100,
    e: 101,
    f: 102,
    g: 103,
    h: 104,
    i: 105,
    j: 106,
    k: 107,
    l: 108,
    m: 109,
    n: 110,
    o: 111,
    p: 112,
    q: 113,
    r: 114,
    s: 115,
    t: 116,
    u: 117,
    v: 118,
    w: 119,
    x: 120,
    y: 121,
    z: 122,
    '{': 123,
    '|': 124,
    '}': 125,
    '~': 126,
    '\x7F': 127,
};
const inverse = {
  '0': '\x00',
  '1': '\x01',
  '2': '\x02',
  '3': '\x03',
  '4': '\x04',
  '5': '\x05',
  '6': '\x06',
  '7': '\x07',
  '8': '\b',
  '9': '\t',
  '10': '\n',
  '11': '\x0B',
  '12': '\f',
  '13': '\r',
  '14': '\x0E',
  '15': '\x0F',
  '16': '\x10',
  '17': '\x11',
  '18': '\x12',
  '19': '\x13',
  '20': '\x14',
  '21': '\x15',
  '22': '\x16',
  '23': '\x17',
  '24': '\x18',
  '25': '\x19',
  '26': '\x1A',
  '27': '\x1B',
  '28': '\x1C',
  '29': '\x1D',
  '30': '\x1E',
  '31': '\x1F',
  '32': ' ',
  '33': '!',
  '34': '"',
  '35': '#',
  '36': '$',
  '37': '%',
  '38': '&',
  '39': "'",
  '40': '(',
  '41': ')',
  '42': '*',
  '43': '+',
  '44': ',',
  '45': '-',
  '46': '.',
  '47': '/',
  '48': '0',
  '49': '1',
  '50': '2',
  '51': '3',
  '52': '4',
  '53': '5',
  '54': '6',
  '55': '7',
  '56': '8',
  '57': '9',
  '58': ':',
  '59': ';',
  '60': '<',
  '61': '=',
  '62': '>',
  '63': '?',
  '64': '@',
  '65': 'A',
  '66': 'B',
  '67': 'C',
  '68': 'D',
  '69': 'E',
  '70': 'F',
  '71': 'G',
  '72': 'H',
  '73': 'I',
  '74': 'J',
  '75': 'K',
  '76': 'L',
  '77': 'M',
  '78': 'N',
  '79': 'O',
  '80': 'P',
  '81': 'Q',
  '82': 'R',
  '83': 'S',
  '84': 'T',
  '85': 'U',
  '86': 'V',
  '87': 'W',
  '88': 'X',
  '89': 'Y',
  '90': 'Z',
  '91': '[',
  '92': '\\',
  '93': ']',
  '94': '^',
  '95': '_',
  '96': '`',
  '97': 'a',
  '98': 'b',
  '99': 'c',
  '100': 'd',
  '101': 'e',
  '102': 'f',
  '103': 'g',
  '104': 'h',
  '105': 'i',
  '106': 'j',
  '107': 'k',
  '108': 'l',
  '109': 'm',
  '110': 'n',
  '111': 'o',
  '112': 'p',
  '113': 'q',
  '114': 'r',
  '115': 's',
  '116': 't',
  '117': 'u',
  '118': 'v',
  '119': 'w',
  '120': 'x',
  '121': 'y',
  '122': 'z',
  '123': '{',
  '124': '|',
  '125': '}',
  '126': '~',
  '127': '\x7F',
};
const corpus = `
function pfreq(tokenized, freqs) {
    for(let i = 0; i < tokenized.length - 1; i++) {
        const pair = [
            tokenized[i],
            tokenized[i + 1],
        ];

        freqs[pair] = (freqs[pair] ?? 0) + 1;
    }
}
function maxfreq(freqs) {
    const entries = Object.entries(freqs);

    let max = 0;
    for(let i = 0; i < entries.length; i++) {
        if(entries[i][1] > entries[max][1])
            max = i;
    }

    if(
        (entries[max] === undefined) ||
        (entries[max][1] === 1)
    ) return null;
    else return entries[max];
}
function register(vocab, inverse, pair) {
    const len = Object.entries(inverse).length;
    const decoded = pair[0].split(",").map(c => inverse[c]).join("");
    if(decoded in vocab) return;

    vocab[decoded] = len;
    inverse[len] = decoded;
}
function strpbrk(src, separators) {
    for(let i = 0; i < src.length; i++) {
        for(let j = 0; j < separators.length; j++) {
            if(src[i] === separators[j]) return i;
        }
    }

    return 0;
}
function chunk(src, separators) {
    const chunks = [];
    
    let temp = src;
    while(temp.length > 1) {
        const id = strpbrk(temp, separators);
        const newId = id ? id : (strpbrk(temp.slice(1), separators) + 1);
        
        chunks.push(temp.slice(0, newId));
        temp = temp.slice(newId);
    }
    chunks.push(temp);

    return chunks;
}
function encode(chunked, vocab) {
    const tokens = [];
    const temp = [...chunked];

    for(let i = 0; i < temp.length; i++) {
        if(tokens[i] === undefined) tokens.push([]);

        for(let j = temp[i].length; j > 0; j--) {
            const encoded = vocab[temp[i].slice(0, j)];
            if(encoded !== undefined) {
                tokens[i].push(encoded);

                if(j !== 0) {
                    temp[i] = temp[i].slice(j);
                    i--;
                }

                break;
            }
        }
    }

    return tokens;
}
function trainBPE(corpus, separators, merges, vocab, inverse) {
    const chunked = chunk(corpus, separators);
    const initialLen = Object.entries(vocab).length;

    let totalMerges = 0;
    for(let i = 0; i < merges; i++) {
        const tokens = encode(chunked, vocab);
        const freqs = {};

        for(let t = 0; t < tokens.length; t++) {
            pfreq(tokens[t], freqs);
        }
        const pair = maxfreq(freqs);
        if(!pair) break;
        
        register(vocab, inverse, pair);
        totalMerges++;
    }

    return {
        merges: totalMerges,
        learned: Object.entries(vocab).slice(initialLen),
    }
}
function tokenize(src, separators, vocab) {
    const chunked = chunk(src, separators);
    const tokens = [];

    for(let i = 0; i < chunked.length; i++) {
        for(let j = chunked[i].length; j > 0; j--) {
            const encoded = vocab[chunked[i].slice(0, j)];
            if(encoded !== undefined) {
                tokens.push(encoded);
                if(j !== 0) {
                    chunked[i] = chunked[i].slice(j);
                    i--;
                }

                break;
            }
        }
    }

    return tokens;
}

const vocab = {
    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,
    '\x00': 0,
    '\x01': 1,
    '\x02': 2,
    '\x03': 3,
    '\x04': 4,
    '\x05': 5,
    '\x06': 6,
    '\x07': 7,
    '\b': 8,
    '\t': 9,
    '\n': 10,
    '\x0B': 11,
    '\f': 12,
    '\r': 13,
    '\x0E': 14,
    '\x0F': 15,
    '\x10': 16,
    '\x11': 17,
    '\x12': 18,
    '\x13': 19,
    '\x14': 20,
    '\x15': 21,
    '\x16': 22,
    '\x17': 23,
    '\x18': 24,
    '\x19': 25,
    '\x1A': 26,
    '\x1B': 27,
    '\x1C': 28,
    '\x1D': 29,
    '\x1E': 30,
    '\x1F': 31,
    ' ': 32,
    '!': 33,
    '"': 34,
    '#': 35,
    '$': 36,
    '%': 37,
    '&': 38,
    "'": 39,
    '(': 40,
    ')': 41,
    '*': 42,
    '+': 43,
    ',': 44,
    '-': 45,
    '.': 46,
    '/': 47,
    ':': 58,
    ';': 59,
    '<': 60,
    '=': 61,
    '>': 62,
    '?': 63,
    '@': 64,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    '[': 91,
    '\\': 92,
    ']': 93,
    '^': 94,
    _: 95,
    ''': 96,
    a: 97,
    b: 98,
    c: 99,
    d: 100,
    e: 101,
    f: 102,
    g: 103,
    h: 104,
    i: 105,
    j: 106,
    k: 107,
    l: 108,
    m: 109,
    n: 110,
    o: 111,
    p: 112,
    q: 113,
    r: 114,
    s: 115,
    t: 116,
    u: 117,
    v: 118,
    w: 119,
    x: 120,
    y: 121,
    z: 122,
    '{': 123,
    '|': 124,
    '}': 125,
    '~': 126,
    '\x7F': 127,
};
const inverse = {
  '0': '\x00',
  '1': '\x01',
  '2': '\x02',
  '3': '\x03',
  '4': '\x04',
  '5': '\x05',
  '6': '\x06',
  '7': '\x07',
  '8': '\b',
  '9': '\t',
  '10': '\n',
  '11': '\x0B',
  '12': '\f',
  '13': '\r',
  '14': '\x0E',
  '15': '\x0F',
  '16': '\x10',
  '17': '\x11',
  '18': '\x12',
  '19': '\x13',
  '20': '\x14',
  '21': '\x15',
  '22': '\x16',
  '23': '\x17',
  '24': '\x18',
  '25': '\x19',
  '26': '\x1A',
  '27': '\x1B',
  '28': '\x1C',
  '29': '\x1D',
  '30': '\x1E',
  '31': '\x1F',
  '32': ' ',
  '33': '!',
  '34': '"',
  '35': '#',
  '36': '$',
  '37': '%',
  '38': '&',
  '39': "'",
  '40': '(',
  '41': ')',
  '42': '*',
  '43': '+',
  '44': ',',
  '45': '-',
  '46': '.',
  '47': '/',
  '48': '0',
  '49': '1',
  '50': '2',
  '51': '3',
  '52': '4',
  '53': '5',
  '54': '6',
  '55': '7',
  '56': '8',
  '57': '9',
  '58': ':',
  '59': ';',
  '60': '<',
  '61': '=',
  '62': '>',
  '63': '?',
  '64': '@',
  '65': 'A',
  '66': 'B',
  '67': 'C',
  '68': 'D',
  '69': 'E',
  '70': 'F',
  '71': 'G',
  '72': 'H',
  '73': 'I',
  '74': 'J',
  '75': 'K',
  '76': 'L',
  '77': 'M',
  '78': 'N',
  '79': 'O',
  '80': 'P',
  '81': 'Q',
  '82': 'R',
  '83': 'S',
  '84': 'T',
  '85': 'U',
  '86': 'V',
  '87': 'W',
  '88': 'X',
  '89': 'Y',
  '90': 'Z',
  '91': '[',
  '92': '\\',
  '93': ']',
  '94': '^',
  '95': '_',
  '96': ''',
  '97': 'a',
  '98': 'b',
  '99': 'c',
  '100': 'd',
  '101': 'e',
  '102': 'f',
  '103': 'g',
  '104': 'h',
  '105': 'i',
  '106': 'j',
  '107': 'k',
  '108': 'l',
  '109': 'm',
  '110': 'n',
  '111': 'o',
  '112': 'p',
  '113': 'q',
  '114': 'r',
  '115': 's',
  '116': 't',
  '117': 'u',
  '118': 'v',
  '119': 'w',
  '120': 'x',
  '121': 'y',
  '122': 'z',
  '123': '{',
  '124': '|',
  '125': '}',
  '126': '~',
  '127': '\x7F',
};
const corpus = "The tall lad and the tall lad.";
const separators = " .";
const merges = 20;

console.log('Pre-merge: [tokenize(corpus, separators, vocab).join(", ")]');
console.log(trainBPE(corpus, separators, merges, vocab, inverse));
console.log('Post-merge: [tokenize(corpus, separators, vocab).join(", ")]');
`;
const c = "The tall lad and the tall lad.";
const separators = ` ,.;:'"[]{}()/?!~\n`;
const merges = 1000;
const totalVocabEntries = 128;

const s = performance.now();
const _merges = trainBPE(
    corpus,
    separators,
    merges,
    vocab,
    inverse,
    totalVocabEntries
);
const e = performance.now();
// for(const [key, value] of _merges.learned) {
//     console.log(`${value}: ${key}`);
// }
console.log(`------------------------------`);
console.log(`Merges done: ${_merges.merges}`);
console.log(`Time taken: ${e - s}ms`);
