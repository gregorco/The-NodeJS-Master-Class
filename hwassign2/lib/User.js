"use strict";
/*
 * Representation of a User
 */
// dependencies


class User {
    constructor(userObj) {
//        if (typeof(userObj) == 'object') {
            this.uid = userObj.uid;
            this.firstName = userObj.firstName;
            this.lastName = userObj.lastName;
            this.phone = userObj.phone;
            this.hashedPassword = userObj.hashedPassword;
            this.emailAddr = userObj.emailAddr;
            this.streetAddr = userObj.streetAddr;
            this.tosAgreement = userObj.true;
            this.orders = typeof(userObj.orders) == 'object'  && userObj.orders instanceof Array ? userObj.orders: [];
            this.cart =  userObj.cart;
//        };
    }

    addOrder(orderObj) {
        this.orders.push(orderObj);
    }

    updateOrder(orderObj) {
        let updateStatus = false;
        // find this order in the array and update it
        for(let i=0; i<this.orders.length; i++) {
            let order = this.orders[i];
            if (order.id == orderObj.id) {
                this.orders[i] = orderObj;
                updateStatus = true;
                break;
            }
        }
        return updateStatus;
    }

    deleteOrder(orderId) {
        this.orders = this.orders.filter(el => el.id !== orderId);
    }

}


module.exports = User;
