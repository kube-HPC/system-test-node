const generateRandomJson = (maxDepth)=> {
    var choices = [  "object"]; //"number", "string", "boolean","array",
    if (maxDepth == 0) {
        choices = ["number", "string", "boolean"];
    }

    var choice = chooseOne(choices);

    function chooseOne(choices) {
        return choices[parseInt(Math.random()*choices.length)];
    }

    if (choice == "number") {
        return generateRandomNumber();
    }
    if (choice == "string") {
        return generateRandomString();
    }
    if (choice == "boolean") {
        return generateRandomBoolean();
    }
    if (choice == "array") {
        return generateRandomArray();
    }
    if (choice == "object") {
        return generateRandomObject(maxDepth);
    }

    function generateRandomNumber () {
        var maxNum = 2**32;
        var number = Math.random()*maxNum;
        var isInteger = chooseOne([true,false]);
        var isNegative = chooseOne([true,false]);

        if (isInteger) number = parseInt(number);
        if (isNegative) number = -number;

        return number;
    }

    function generateRandomString () {
        var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

        var maxLength = 100;
        var length = Math.random()*maxLength;
        var string = "";
        for (var i = 0; i < length; i++) {
            string += chooseOne(alphabet);
        }

        return string;
    } 

    function generateRandomBoolean () {
        return chooseOne([true,false]);
    }

    function generateRandomArray () {
        var maxArrayLength = 10;
        var length = parseInt(Math.random()*maxArrayLength);

        var array = [];  
        for (var i = 0; i < length; i++) {
            array[i] = generateRandomJson(maxDepth-1);
        }

        return array;
    }

    function generateRandomObject (maxDepth) {
        var maxObjectKeys = 10;
        var keyCount = parseInt(Math.random()*maxObjectKeys)+1;

        var object = {};  
        for (var i = 0; i < keyCount; i++) {
            var key = generateRandomKeyName();
            object[key] = generateRandomJson(maxDepth-1);
        }

        return object;
    }

    function generateRandomKeyName () {
        var maxKeyLength = 10;
        var keyLength = 1 + Math.floor(Math.random()*maxKeyLength);
        var randomString = generateRandomString();
        return randomString.slice(0, keyLength);
    }
}

module.exports = {
    generateRandomJson 
}