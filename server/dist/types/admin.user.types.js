"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCode = void 0;
// Error codes
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["DUPLICATE_PHONE"] = "DUPLICATE_PHONE";
    ErrorCode["DUPLICATE_EMAIL"] = "DUPLICATE_EMAIL";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["UNAUTHORIZED"] = "UNAUTHORIZED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
