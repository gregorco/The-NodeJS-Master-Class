"use strict";
/*
 * Representation of an Order
 * 	id			(PK)
	userUid			(FK)
	status // active, paid, shipped, canceled, completed, expired
	menuItems [	{index:<idx1>, count: <count>},
			{index:<idx1>, count: <count>},
			…
			{index:<idx1>, count: <count>}
	]
	deliveryAddress
	creditCard {
		holderName,
		address,
		expirationMonth,
		expirationYear,
		securityCode
	}
 */
// dependencies


class Order {
    constructor(orderObj) {
//        if (typeof(orderObj) == 'object') {
        this.id = orderObj.id;
        this.userUid = orderObj.userUid;
        this.menuItems = orderObj.menuItems;
//        };
    }

    add(menuItem) {
        this.menuItems.push(menuItem);
    }

    set status(statusCode) {
        this._status = statusCode;
    }
    get status() {
        return this._status;
    }

    set deliveryAddress(addr) {
        this._deliveryAddress = addr;
    }
    get deliveryAddress() {
        return this._deliveryAddress;
    }

    set creditCard(credCard) {
        this._creditCard = credCard;
    }
    get creditCard() {
        return this._creditCard;
    }
}


module.exports = Order;
