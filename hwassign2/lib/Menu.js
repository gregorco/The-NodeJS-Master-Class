"use strict";
/*
 * Representation of an Menu
 */
// dependencies
let MenuItem = require('./MenuItem');

class Menu {
    constructor() {
        this.menuItems = {
            // pizzas
            "1": new MenuItem({"id": 1, "type": "pizza", "name": "pepperoni", "price": 10.0}),
            "2": new MenuItem({"id": 2, "type": "pizza", "name": "veggie", "price": 8.0}),
            "3": new MenuItem({"id": 3, "type": "pizza", "name": "hawaiin", "price": 10.0}),
            "4": new MenuItem({"id": 4, "type": "pizza", "name": "sausage", "price": 10.0}),
            "5": new MenuItem({"id": 5, "type": "pizza", "name": "deluxe", "price": 12.0}),
            // breadsticks
            "6": new MenuItem({"id": 6, "type": "breadsticks", "name": "plain", "price": 5.0}),
            "7": new MenuItem({"id": 7, "type": "breadsticks", "name": "garlic", "price": 6.0}),
            "8": new MenuItem({"id": 8, "type": "breadsticks", "name": "cheese", "price": 7.0})
        };
    }
}


module.exports = Menu;
