// query-string 7 calls require('decode-uri-component') as a function.
// The alias avoids recursively resolving the root override back to this adapter.
// Keep that contract while using the upstream security fix, without copying it.
module.exports = require('upstream-decode-uri-component').default;
