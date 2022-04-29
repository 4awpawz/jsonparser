#!/usr/bin/env node
/**
 * @module
 *
*/

"use strict";

const path = require("path");
const { version } = require("../package.json");
const { jp1, jp2 } = require("../core/jsonparser");

const log = console.log.bind(console);
const options = [];
var encoding = "utf-8";
const isTTY = process.stdin.isTTY;

function validate(arrayOfOptions, actualOption) {
    const parts = actualOption.split("=");
    if (parts.length !== 2 || !arrayOfOptions.includes(parts[0]) || parts[1].length === 0) {
        return false;
    }
    return true;
}

function validateOption1(option) {
    return validate(["--input", "--raw"], option);
}

function validateOption2(option) {
    return validate(["--output"], option);
}

if (!isTTY) {
    // Piped input.
    jp2();
} else {
    // Command line input.
    process.argv.slice(2)
        .filter(arg => arg[0] === "-")
        .reduce((accum, value) => {
            if (value.startsWith("--")) {
                accum.push(value);
                return accum;
            } else {
                [...value].forEach(item => {
                    if (item !== "-") {
                        accum.push(`-${item}`);
                    }
                });
                return accum;
            }
        }, options);

    /**
     * Get all of the commands and arguments.
     */
    const commands = process.argv
        .slice(2)
        .filter(arg => arg[0] !== "-");

    /**
     * Prints generalized help to stdout.
     */
    // TODO: 22/04/26 00:28:37 - jeffreyschwartz : Add an option for replacing single quotes with double quoutes.
    const generalHelp = () => {
        log("jsonparser");
        log("");
        log("Overview:");
        log("    jsonparser is a dual-use, Unix-like utility that converts JSON to JavaScript. It supports both command line and piped input.");
        log("");
        log("Command Line Usage:");
        log("    jsonparser --input=[path/to/input/file] | --raw=[content] --output=[path/to/output/file]");
        log("");
        log("    where [option] is one of:");
        log("    -v | --version (version)");
        log("    -h | --help (this help)");
        log("");
        log("Piping Usage:");
        log("    echo ' {\"firstNamme\": \"John\", \"lastName\": \"Doe\"}'");
        log("    cat [path/to/file.json] | jsonparser | [path/to/file.js]");
        log("");
        log("Note:");
        log("    If --input file is in the cwd then you must provide a relative path, i.e. './[file name]'.");
        log("    If --output is omitted then output is directed to stdout.");
    };

    /**
     * Command validation and execution.
     */

    const parse = {
        validate(options) {
            if (commands.length !== 0 || !(options.length > 0 && options.length <= 2)) {
                return false;
            }
            if (!validateOption1(options[0])) {
                log("input path or raw content is missing");
                return false;
            }
            if (options.length === 2 && !validateOption2(options[1])) {
                log("ouptut path is missing");
                return false;
            }
            return true;
        },
        valid(options) {
            const partsIn = options[0].split("=");
            // if --input then get the absolute path otherwise the content is raw.
            const input = partsIn[0] === "--input" && path.resolve(partsIn[1]) || partsIn[1];
            const partsOut = options.length === 2 && options[1].split("=");
            // if --output then get the absolute path otherwise it is stdout.
            const output = options.length === 2 && path.resolve(partsOut[1]) || "stdout";
            jp1({
                in: {
                    type: partsIn[0],
                    input,
                },
                out: {
                    type: partsOut[0],
                    output,
                },
            });
        },
        invalid: () => generalHelp(),
    };

    /**
     * Command runnder.
     */
    // if (options[0] === "-h" || options[0] === "--help") {
    if (["-h", "--help"].includes(options[0])) {
        generalHelp();
    } else if (["-v", "--version"].includes(options[0])) {
        log(version);
        log("");
    } else if (parse.validate(options)) {
        parse.valid(options);
    } else {
        parse.invalid();
    }
}
