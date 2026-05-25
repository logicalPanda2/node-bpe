/**
 * Iterates through `tokenized` and computes
 * the frequencies of all pairs' occurrences
 * without mutating existing properties in `freq`.
 * @param {string | number[]} tokenized 
 * @param {Record<string, number>} freqs 
 * @returns {void}
 * @example 
 * ```
 * const str = "Helllo"; // mind the three 'l's
 * const freqs = {
 *   "foo": 42,
 * };
 * pfreq(str, freqs);
 * 
 * // freqs is now:
 * {
 *   "foo": 42,
 *   "H,e": 1, 
 *   "e,l": 1,
 *   "l,l": 2,
 *   "l,o": 1,
 * }
 * ```
 */
function pfreq(tokenized, freqs) {
    for(let i = 0; i < tokenized.length - 1; i++) {
        const pair = [
            tokenized[i],
            tokenized[i + 1],
        ];

        freqs[pair] = (freqs[pair] ?? 0) + 1;
    }
}
/**
 * Iterates through all pair frequencies and
 * returns the pair with the highest number of occurences.
 * If several pairs has the same frequency, `maxfreq` will
 * return the first encountered pair. 
 * If the pair with the maximum frequency 
 * has a frequency 1, `maxfreq` will return null.
 * @param {Record<string, number>} freqs 
 * @returns {[string, number] | null}
 * @example
 * ```
 * const freqs = {
 *   "rt": 12,
 *   "la": 12, 
 *   "ds": 3,
 * };
 * const pair = maxfreq(freqs); // ["rt", 12]
 */
function maxfreq(freqs) {
    const entries = Object.entries(freqs);

    let max = 0;
    for(let i = 0; i < entries.length; i++) {
        if(entries[i][1] > entries[max][1])
            max = i;
    }

    return entries[max][1] === 1 ? null : entries[max];
}
/**
 * Registers a new token into `vocab` and
 * the corresponding inverse in `inverse`.
 * The value of the new string is the current 
 * length of the vocabulary. Duplicate identifiers
 * will not cause any side effects.
 * @param {Record<string, number>} vocab
 * @param {Record<number, string>} inverse
 * @param {[string, number]} pair
 * @returns {void}
 * @example
 * ```
 * const vocab = {
 *   "foo": 0,
 *   "he": 1,
 *   "llo": 2,
 * };
 * const inverse = {
 *   "0": "foo",
 *   "1": "he",
 *   "2": "llo",
 * };
 * const pair = ["1,2", 23];
 * register(vocab, inverse, pair);
 * 
 * // vocab is now:
 * {
 *   "foo": 0,
 *   "he": 1,
 *   "llo": 2,
 *   "hello": 3,
 * };
 * // inverse is now:
 * const inverse = {
 *   "0": "foo",
 *   "1": "he",
 *   "2": "llo",
 *   "3": "hello",
 * };
 * ```
 */
function register(vocab, inverse, pair) {
    const len = Object.entries(inverse).length;
    const decoded = pair[0].split(",").map(c => inverse[c]).join("");
    if(decoded in vocab) return;

    vocab[decoded] = len;
    inverse[len] = decoded;
}
/**
 * Returns the index of the first encountered 
 * separator in `src` that is in `separators`.
 * An empty `src` or `separators` will return 0.
 * @param {string} src
 * @param {string} separators
 * @returns {number}
 * @example
 * ```
 * const src = "Hello there";
 * const separator = " ";
 * const index = strpbrk(src, separator); // 5
 * ```
 */
function strpbrk(src, separators) {
    for(let i = 0; i < src.length; i++) {
        for(let j = 0; j < separators.length; j++) {
            if(src[i] === separators[j]) return i;
        }
    }

    return 0;
}
/**
 * Transforms the `src` string into chunks separated 
 * by `separators`, inclusive of separators.
 * @param {string} src 
 * @param {string} separators 
 * @returns {string[]}
 * @example
 * ```
 * const src = "Yesterday I drank apple juice.";
 * const separators = " .";
 * const chunks = chunk(src, separators);
 * // ['Yesterday', ' I', ' drank', ' apple', ' juice', '.']
 * ```
 */
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
/**
 * Encodes a chunked string `chunked` into an
 * array of tokens based on `vocab` greedily.
 * @param {string[]} chunked 
 * @param {Record<string, number>} vocab 
 * @returns {number[][]}
 * @example
 * ```
 * const vocab = {
 *      "Hello": 0,
 *      "the": 1,
 *      "re": 2,
 *      " bro": 3,
 *      ".": 4,
 *      " ": 5,
 *  };
 *  const chunked = ["Hello", "there", " bro", "."];
 *  const tokens = encode(chunked, vocab); // [0, 1, 2, 3, 4]
 * ```
 */
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

export { pfreq, maxfreq, register, strpbrk, chunk, encode };
