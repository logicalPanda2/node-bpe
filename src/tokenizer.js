export default function (source, vocabulary) {
    const tokens = [];
    let copy = source;
    let i = copy.length;
    while(true) {
        const substring = copy.slice(0, i);
        if(vocabulary[substring]) {
            tokens.push(vocabulary[substring]);
            copy = copy.slice(i);
            i = copy.length;

            if(copy.length > 0) 
                continue;
            else 
                break;
        }
        i--;
    }

    return tokens;
}
