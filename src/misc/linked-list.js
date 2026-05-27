class Node {
    constructor(value, id, prev = null, next = null) {
        this.value = value;
        this.id = id;
        this.prev = prev;
        this.next = next;
    }

    insert(node) {
        if(this.next) this.next.prev = node; // C.prev = B
        node.next = this.next; // B.next = C
        node.prev = this; // B.prev = A
        this.next = node; // A.next = B
    }

    delete(node) {
        node.next.prev = this; // C.prev = A
        this.next = node.next; // A.next = C
    }
}

class DoublyLinkedList {
    constructor(...values) {
        const start = new Node(values[0], 0);
        for(let i = values.length - 1; i > 0; i--) {
            start.insert(
                new Node(values[i], i)
            );
        }

        this.start = start;
        this.length = values.length;
    }

    info(printNodes = false) {
        console.log(`List Information`);
        console.log(`start node: { value: ${this.start.value}, id: ${this.start.id} }`);
        console.log(`node count: ${this.length}`);

        if(!printNodes) return;

        let node = this.start;

        console.log(`\nNodes Information`);
        const _prev = 
                node.prev
                ? `{ value: ${node.prev.value}, id: ${node.prev.id} }`
                : `        null       `;
        const _n = `{ value: ${node.value}, id: ${node.id} }`;
        const _next = 
            node.next
            ? `{ value: ${node.next.value}, id: ${node.next.id} }`
            : "null";
        console.log(`${_prev} <- ${_n} -> ${_next}`);
        node = node.next;
        
        while(node.next !== null) {
            const prev = 
                node.prev
                ? `{ value: ${node.prev.value}, id: ${node.prev.id} }`
                : "null";
            const n = `{ value: ${node.value}, id: ${node.id} }`;
            const next = 
                node.next
                ? `{ value: ${node.next.value}, id: ${node.next.id} }`
                : "null";
            
            console.log(`${prev} <- ${n} -> ${next}`);
            node = node.next;
        }
        
        const prev = 
                node.prev
                ? `{ value: ${node.prev.value}, id: ${node.prev.id} }`
                : "null";
        const n = `{ value: ${node.value}, id: ${node.id} }`;
        const next = 
            node.next
            ? `{ value: ${node.next.value}, id: ${node.next.id} }`
            : `        null`;
        
        console.log(`${prev} <- ${n} -> ${next}`);
    }
}

const l = new DoublyLinkedList(5, 4, 6, 5, 4, 9);
l.info(true);
