#!/usr/bin/env node
/**
 * Command line and pipe processing.
*/

"use strict";

const path = require("path");
const { version } = require("../package.json");
const { jp1, jp2 } = require("../core/jsonparser");

const log = console.log.bind(console);
const isTTY = process.stdin.isTTY;

function validateOptions(options) {
    const allowedOptions = ["--input", "--raw", "--output", "-d"];
    const mustHaveOptions = ["--input", "--raw"];
    // Validate options are valid.
    for (const option of options) {
        if (!allowedOptions.includes(option.split("=")[0])) {
            log(`Option ${option} is invalid!`);
            return false;
        }
    }
    // Validate options does not include both --input and --raw.
    let count = 0;
    for (const option of options) {
        mustHaveOptions.includes(option.split("=")[0]) && count++;
        if (count === 2) {
            log(`Options ${mustHaveOptions[0]} and ${mustHaveOptions[1]} are mutually exlusive!`);
            return false;
        }
    }
    return true;
}

/**
 * Get the options.
 */
let options = [];
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

if (!isTTY) {
    // Piped input.
    jp2(options);
} else {
    /**
     * Print help to the console.
     */
    const generalHelp = () => {
        log("jsonparser");
        log("");
        log("Overview:");
        log("    jsonparser is a dual-use, Unix-like utility that converts JSON to JavaScript. It supports both command line and piped input.");
        log("");
        log("Command Line Usage:");
        log("    jsonparser -d  --input=[path/to/input/file] | --raw=[content] --output=[path/to/output/file]");
        log("");
        log("    where [option] is one of:");
        log("    -v | --version (version)");
        log("    -h | --help (this help)");
        log("    -d | use double quotes (i.e. \"\"), defaults to single quotes (i.e. '')");
        log("   --input | the path to the input file");
        log("   --raw | raw input");
        log("   --output | the path to the output file");
        log("");
        log("Piping Usage:");
        log("    echo ' {\"firstNamme\": \"John\", \"lastName\": \"Doe\"}' | jsonparser");
        log("    cat [path/to/file.json] | jsonparser > [path/to/file.js]");
        log("");
        log("Note:");
        log("    --raw input must be enclosed using either single ('') or double quotes (\"\").");
        log("    If the --input file is in the cwd then you must provide a relative path, i.e. './[file name]'.");
        log("    If the --output is omitted then the output is directed to stdout.");
    };

    /**
     * Command validation and execution.
     */
    const parse = {
        validate(options) {
            if (commands.length !== 0 || !(options.length >= 1 && options.length <= 3)) {
                return false;
            }
            return validateOptions(options);
        },
        valid(options) {
            const partsIn = options.find(option => option.startsWith("--input") || option.startsWith("--raw")).split("=");
            // if --input then get the absolute path otherwise the content is raw.
            const input = partsIn[0] === "--input" && path.resolve(partsIn[1]) || partsIn[1];
            const partsOut = options.some(option => option.startsWith("--output")) && options.find(option => option.startsWith("--output")).split("=");
            // if --output then get the absolute path otherwise it is stdout.
            const output = Array.isArray(partsOut) && path.resolve(partsOut[1]) || "stdout";
            jp1({
                in: {
                    type: partsIn[0],
                    input,
                },
                out: {
                    type: partsOut[0],
                    output,
                    quotes: options.includes("-d") && "double" || "single",
                },
            });
        },
        invalid: () => generalHelp(),
    };

    /**
     * Command runner.
     */
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
