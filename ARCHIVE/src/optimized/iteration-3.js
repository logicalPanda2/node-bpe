import { Node, DoublyLinkedList } from "../misc/linked-list.js";

// METADATA
// 8 KB of text (same corpus as iteration-0.js)

// OPTIMIZED:
// linked list refactor and move pair counting outside hot loop: 45ms average

function strpbrk(src, separators) {
    for(let i = 1; i < src.length; i++) {
        for(let j = 0; j < separators.length; j++) {
            if(src[i] === separators[j]) return i;
        }
    }

    return src.length;
}

function trainBPE(corpus, separators, merges, vocab, inverse) {
    const initialLen = Object.values(vocab).length;
    let VOCAB_SIZE = initialLen;

    // PSEUDO REGEX CHUNKING
    // separate the corpus into chunks based on the given separators
    // separators are merged into the next chunk if a next chunk exists
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
    // transform all tokenized chunks with length > 1 into a doubly linked list
    // BPE is fundamentally about pairs, so ignore stand-alone tokens
    for(let i = 0; i < tokens.length; i++) {
        tokens[i] = new DoublyLinkedList(...tokens[i]);
    }

    // PAIR COUNTING
    // within the bounds of each sublist, 
    // count all overlapping n - 1 pairs within that list,
    // and store pointers to the start of each pair.
    // also tally the frequencies because only unique chunks were processed previously
    const pairs = {};
    const chunkFreqArr = Object.values(chunkFrequencies);
    for(let i = 0; i < tokens.length; i++) {
        let node = tokens[i].start;
        while(node.next !== null) {
            const pair = [node.value, node.next.value];
            if(!pairs[pair]) {
                pairs[pair] = {
                    0: node,
                    nextId: 1,
                    frequencies: chunkFreqArr[i],
                    chunkIndices: [i],
                }
            } else {
                pairs[pair].frequencies += chunkFreqArr[i];
                pairs[pair][pairs[pair].nextId++] = node;
                pairs[pair].chunkIndices.push(i);
            }

            node = node.next;
        }
    }
    
    for(let i = 0; i < merges; i++) {
        const pairArr = Object.entries(pairs);
        
        let max = 0;
        for(let i = 0; i < pairArr.length; i++) {
            if(pairArr[i][1].frequencies > pairArr[max][1].frequencies)
                max = i;
        }

        if(pairArr[max][1].frequencies === 1) break;

        const key = pairArr[max][0];
        const keyString = key.split(",").map(c => inverse[c]).join("");
        let i = 0;
        while(true) {
            const oldLeftPairKey = [pairs[key][i].prev?.value, pairs[key][i].value];
            const oldRightPairKey = [pairs[key][i].next?.value, pairs[key][i].next?.next?.value];
            if(pairs[oldLeftPairKey])
                delete pairs[oldLeftPairKey];
                // pairs[oldLeftPairKey].frequencies -= chunkFreqArr[pairs[key].chunkIndices[i]];
            if(pairs[oldRightPairKey])
                delete pairs[oldRightPairKey];
                // pairs[oldRightPairKey].frequencies -= chunkFreqArr[pairs[key].chunkIndices[i]];

            pairs[key][i].value = VOCAB_SIZE;
            pairs[key][i].redirect();

            if(pairs[key][i].prev) {
                pairs[key][i].prev.next = pairs[key][i];
            }

            const newLeftPairKey = [pairs[key][i].prev?.value, pairs[key][i].value];
            const newRightPairKey = [pairs[key][i].value, pairs[key][i].next?.value];
            if(newLeftPairKey[0])
                if(!pairs[newLeftPairKey]) {
                    pairs[newLeftPairKey] = {
                        0: pairs[key][i].prev,
                        nextId: 1,
                        // if something is wrong, all lines with the chunkIndices is at fault
                        frequencies: chunkFreqArr[pairs[key].chunkIndices[i]],
                        chunkIndices: [pairs[key].chunkIndices[i]],
                    }
                } else {
                    pairs[newLeftPairKey].frequencies += chunkFreqArr[pairs[key].chunkIndices[i]];
                    pairs[newLeftPairKey][pairs[newLeftPairKey].nextId++] = pairs[key][i].prev;
                    pairs[newLeftPairKey].chunkIndices.push(pairs[key].chunkIndices[i]);
                }
            if(newRightPairKey[1])
                if(!pairs[newRightPairKey]) {
                    pairs[newRightPairKey] = {
                        0: pairs[key][i],
                        nextId: 1,
                        // if something is wrong, all lines with the chunkIndices is at fault
                        frequencies: chunkFreqArr[pairs[key].chunkIndices[i]],
                        chunkIndices: [pairs[key].chunkIndices[i]],
                    }
                } else {
                    pairs[newRightPairKey].frequencies += chunkFreqArr[pairs[key].chunkIndices[i]];
                    pairs[newRightPairKey][pairs[newRightPairKey].nextId++] = pairs[key][i];
                    pairs[newRightPairKey].chunkIndices.push(pairs[key].chunkIndices[i]);
                }
            
            i++;
            if(!pairs[key][i])
                break;
        }
        
        delete pairs[key];
        vocab[keyString] = VOCAB_SIZE;
        inverse[VOCAB_SIZE] = keyString;
        VOCAB_SIZE++;
    }

    return {
        merges: VOCAB_SIZE - initialLen,
        learned: Object.entries(vocab).slice(initialLen),
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

const s = performance.now();
const _merges = trainBPE(corpus, separators, merges, vocab, inverse);
const e = performance.now();
console.log(`merges: ${_merges.merges}`);
// console.log(..._merges.learned);
console.log(`Time taken: ${e - s}ms`);
