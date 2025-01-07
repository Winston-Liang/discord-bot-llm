class Queue {
    constructor() {
      this.queue = [];
    }
  
    enqueue(element) {
      this.queue.push(element);
    }
  
    dequeue() {
      return this.queue.shift();
    }
  
    peek() {
      return this.queue[0];
    }

    length(){
        return len(this.queue);
    }
  }

module.exports = Queue;