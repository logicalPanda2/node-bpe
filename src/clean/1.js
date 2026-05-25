/**
 * Iterates through `tokenized` and computes
 * the frequencies of all pairs' occurrences
 * without mutating existing properties in `freq`.
 * @param {string} tokenized 
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
 * Registers a new pair into the vocabulary.
 * The value of the new string is the current 
 * length of the vocabulary. Duplicate identifiers
 * will not cause any side effects.
 * @param {Record<string, number>} vocab
 * @param {[string, number]} pair
 * @returns {void}
 * @example
 * ```
 * const vocab = {
 *   "foo": 0,
 * };
 * const pair = ["hello", 23];
 * register(vocab, pair);
 * 
 * // vocab is now:
 * {
 *   "foo": 0,
 *   "hello": 1,
 * };
 * ```
 */
function register(vocab, pair) {
    if(pair[0] in vocab) return;

    const len = Object.entries(vocab).length;
    vocab[pair[0]] = len;
}
