"use strict";
/*
 * Representation of an Credit Card
 * 	{
		holderName,
		address,
		cardNumber,
		expirationMonth,
		expirationYear,
		securityCode
	}
 */

class CreditCard {
    constructor(cardObj) {
//        if (typeof(cardObj) == 'object') {
        this.holderName = cardObj.holderName;
        this.address = cardObj.address;
        this.cardNumber = cardObj.cardNumber;
        this.expirationMonth = cardObj.expirationMonth;
        this.expirationYear = cardObj.expirationYear;
        this.securityCode = cardObj.securityCode;
//        };
    }

    validate() {
        let holderName = typeof(this.holderName) == 'string' && this.holderName.trim().length > 0 ? this.holderName.trim() : false;
        let address = typeof(this.address) == 'string' && this.address.trim().length > 0 ? this.address.trim() : false;
        let cardNumber = typeof(this.cardNumber) == 'string' && this.cardNumber.trim().length == 16 ? this.cardNumber.trim() : false;
        let expirationMonth = typeof(this.expirationMonth) == 'number' && this.expirationMonth >= 1 && this.expirationMonth <= 12 ? this.expirationMonth : false;
        let expirationYear = typeof(this.expirationYear) == 'number' && this.expirationYear >= 2020 && this.expirationYear <= 2100 ? this.expirationYear : false;
        let securityCode = typeof(this.securityCode) == 'number' && this.securityCode >=100 && this.securityCode < 1000 ? this.securityCode : false;
        return holderName && address && cardNumber && expirationMonth && expirationYear && securityCode;
    }

}


module.exports = CreditCard;
