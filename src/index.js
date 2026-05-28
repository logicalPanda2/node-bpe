import DoublyLinkedList from "./DoublyLinkedList.js";

export default class nodeBPE {
    static train({
        corpus,
        merges,
        separators,
        encodeTable,
        decodeTable,
        totalEntries,
    }) {
        const start = performance.now();
        let VOCAB_SIZE = totalEntries;

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
        if(corpus.length > 0 && !chunkFrequencies[corpus]) {
            chunks.push(corpus);
            chunkFrequencies[corpus] = 1;
        } else {
            chunkFrequencies[corpus]++;
        }
        
        const tokens = [];
        for(let i = 0; i < chunks.length; i++) {
            if(tokens[i] === undefined) tokens.push([]);

            for(let j = chunks[i].length; j > 0; j--) {
                const substring = chunks[i].slice(0, j);
                if(encodeTable[substring]) {
                    tokens[i].push(encodeTable[substring]);
                    chunks[i] = chunks[i].slice(j);

                    i--;
                    break;
                }
            }
        }
        for(let i = 0; i < tokens.length; i++) {
            tokens[i] = new DoublyLinkedList(...tokens[i]);
        }

        const pairs = {};
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
            let key = null;
            let maxFrequencies = 0;
            for(const p in pairs) {
                if(pairs[p].frequencies > maxFrequencies) {
                    key = p;
                    maxFrequencies = pairs[p].frequencies;
                }
            }

            if(maxFrequencies <= 1)
                break;

            const keyString = key.split(",").map(c => decodeTable[c]).join("");
            encodeTable[keyString] = VOCAB_SIZE;
            decodeTable[VOCAB_SIZE] = keyString;

            const pair = pairs[key];
            let x = 0;
            for(let x = 0; x < pair.nextId; x++) {
                if(!pair[x])
                    continue;

                const currentPair = pair[x];

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

                currentPair.node.value = VOCAB_SIZE;
                currentPair.node.redirect();

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

            delete pairs[key];
            VOCAB_SIZE++;
        }

        const end = performance.now();
        return {
            tokens_learned: Object.entries(encodeTable).slice(totalEntries),
            merges_done: VOCAB_SIZE - totalEntries,
            time_taken: `${(end - start).toFixed(4)}ms`,
        }
    }
    static utf8EncodeTable128Entries = {
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
    static utf8DecodeTable128Entries = {
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
    static defaultSeparators = ` ,.;:'"\`[]{}()/?!~\n\\`;
    static defaultEntries = 128;
}

export const strpbrk = (src, separators) => {
    for(let i = 1; i < src.length; i++) {
        for(let j = 0; j < separators.length; j++) {
            if(src[i] === separators[j]) return i;
        }
    }

    return src.length;
}
