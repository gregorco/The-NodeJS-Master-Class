"use strict";
/*
 * Representation of an MenuItem
 */
// dependencies


class MenuItem {
    constructor(menuItem) {
//        if (typeof(userObj) == 'object') {
        this.id = menuItem.id;
        this.type = menuItem.type;
        this.name = menuItem.name;
        this.price = menuItem.price;
//        };
    }

}


module.exports = MenuItem;
