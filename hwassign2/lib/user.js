"use strict";
/*
 * Representation of a User
 */
// dependencies


class User {
    constructor(userObj) {
//        if (typeof(userObj) == 'object') {
            this.firstName = userObj.firstName;
            this.lastName = userObj.lastName;
            this.phone = userObj.phone;
            this.hashedPassword = userObj.hashedPassword;
            this.emailAddr = userObj.emailAddr;
            this.streetAddr = userObj.streetAddr;
            this.tosAgreement = userObj.true;
//        };
    }


}


module.exports = User;
