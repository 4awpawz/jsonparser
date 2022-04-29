/**
 * @module
 *
*/

"use strict";

const util = require("util");
const JSONC = require("jsonc");
const log = console.log.bind(console);
const encoding = "utf-8";

function changeSingleToDoubleQuotes(str) {
    const regex = /'/g;
    return str.replace(regex, "\"");
}

/*
 * Called when ther is ommand line input.
 */
exports.jp1 = function(params) {
    const fs = require("fs-extra");
    let json = "";
    if (params.in.type === "--input") {
        json = fs.readFileSync(params.in.input, encoding); // File
    } else {
        json = params.in.input; //Raw
    }
    let parsed = params.out.type === "stdout" && JSONC.parse(json) || util.format("%O", JSONC.parse(json));
    // Replace single quotes with double quotes.
    parsed = changeSingleToDoubleQuotes(parsed);
    if (params.out.type === "--output") {
        fs.writeFileSync(params.out.output, parsed, encoding); // File
    } else {
        log(parsed);
    }
};

/*
 * Called when being piped.
 */
exports.jp2 = function() {
    function parse(json) {
        const result = JSONC.parse(json);
        const formatatted = changeSingleToDoubleQuotes(util.format("%O", result));
        log(formatatted);
    }
    function getInput() {
        return new Promise(function(resolve, reject) {
            let data = "";
            process.stdin.setEncoding(encoding);
            process.stdin.on("data", function(chunk) {
                data += chunk;
            });
            process.stdin.on("end", function() {
                resolve(data);
            });
            process.stdin.on("error", reject);
        });
    }
    getInput().then(parse).catch(console.error);
};
