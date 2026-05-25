/**
 * Iterates through `tokenized` and computes
 * the frequencies of all pairs' occurrences
 * without mutating existing properties in `freq`
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
 *   foo: 42,
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
