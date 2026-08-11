import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

assert.equal(read(".github/CODEOWNERS").trim(), "* @nigaray703-ops");

const authors = read("AUTHORS.md");
assert.match(authors, /independent portfolio project/i);
assert.match(authors, /sole official owner and maintainer/i);

const contributing = read("CONTRIBUTING.md");
assert.match(contributing, /Unsolicited pull requests are not accepted/i);
assert.match(contributing, /human recordings/i);

const license = read("LICENSE.md");
assert.match(license, /Public access, cloning, downloading, or forking does not transfer ownership/i);
assert.match(license, /does not create joint authorship/i);

const readme = read("README.md");
assert.match(readme, /Independent portfolio project/i);
assert.match(readme, /not a community or collaborative open-source project/i);
assert.match(readme, /AUTHORS\.md/);
assert.match(readme, /CONTRIBUTING\.md/);

console.log("ownership and contribution policy checks passed");
