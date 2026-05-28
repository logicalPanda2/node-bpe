export default class DoublyLinkedList {
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

        if(rightPtr) {                          // additional ghost node safeguards
            rightPtr.next = null;
            rightPtr.prev = null;
        }
    }
}
