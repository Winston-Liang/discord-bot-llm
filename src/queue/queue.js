"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var wait = require('node:timers/promises').setTimeout;
var Queue = /** @class */ (function () {
    function Queue() {
        this.queue = {};
        //Data format
        // {
        //     interactionId: interaction, 
        //     status: {
        //         position: int
        //     }
        // }
    }
    Queue.prototype.addItem = function (interaction) {
        //How many items are already in the queue?
        var queueLength = this.length();
        this.queue[interaction.id] = {
            interaction: interaction,
            status: {
                position: queueLength
            }
        };
        console.log(this.queue);
    };
    Queue.prototype.removeItem = function (interactionId) {
        //When item is removed, 
        delete this.queue[interactionId];
    };
    Queue.prototype.getItem = function (interactionId) {
        return this.queue[interactionId];
    };
    Queue.prototype.getQueue = function () {
        return this.queue;
    };
    Queue.prototype.length = function () {
        return Object.keys(this.queue).length;
    };
    Queue.prototype.isEmpty = function () {
        return Object.keys(this.queue).length === 0 && this.queue.constructor === Object;
    };
    return Queue;
}());
exports.default = Queue;
