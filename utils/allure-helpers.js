import { allure } from 'allure-playwright';
import HTTP_STATUS from './http-status.js';

export class AllureHelpers {

    static async logRequest(method, url, headers = {}, body = null) {
        const requestData = {
            method: method.toUpperCase(),
            url: url,
            headers: headers,
            body: body,
            timestamp: new Date().toISOString(),
            userAgent: 'Playwright API Client'
        };

        await allure.attachment(
            'Request',
            JSON.stringify(requestData, null, 2),
            'application/json'
        );
    }

    static async logResponse(status, headers = {}, body = null) {
        const responseData = {
            status: status,
            statusText: this._getStatusText(status),
            headers: headers,
            body: body,
            timestamp: new Date().toISOString(),
            contentType: headers['content-type'] || 'unknown'
        };

        await allure.attachment(
            'Response',
            JSON.stringify(responseData, null, 2),
            'application/json'
        );
    }

    static _getStatusText(status) {
        const statusTexts = {
            [HTTP_STATUS.OK]: 'OK',
            [HTTP_STATUS.CREATED]: 'Created',
            [HTTP_STATUS.NO_CONTENT]: 'No Content',
            [HTTP_STATUS.BAD_REQUEST]: 'Bad Request',
            [HTTP_STATUS.UNAUTHORIZED]: 'Unauthorized',
            [HTTP_STATUS.FORBIDDEN]: 'Forbidden',
            [HTTP_STATUS.NOT_FOUND]: 'Not Found',
            [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
            [HTTP_STATUS.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
            [HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
            [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
            [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'Internal Server Error'
        };
        return statusTexts[status] || 'Unknown';
    }

    static async logRequestResponse(method, url, requestHeaders = {}, requestBody = null, responseStatus, responseHeaders = {}, responseBody = null) {
        await allure.step(`HTTP ${method.toUpperCase()} ${url}`, async () => {
            await this.logRequest(method, url, requestHeaders, requestBody);
            await this.logResponse(responseStatus, responseHeaders, responseBody);
        });
    }

    static async logValidationError(field, error, data = null) {
        const errorData = {
            field: field,
            error: error,
            data: data
        };

        await allure.attachment(
            `Validation Error - ${field}`,
            JSON.stringify(errorData, null, 2),
            'application/json'
        );
    }

    static async logModelValidation(modelName, validationResult, data = null) {
        const validationData = {
            model: modelName,
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            data: data
        };

        await allure.attachment(
            `Model Validation - ${modelName}`,
            JSON.stringify(validationData, null, 2),
            'application/json'
        );
    }

    static async logModelValidationIfInvalid(modelName, validationResult, data = null) {
        if (!validationResult.isValid) {
            await this.logModelValidation(modelName, validationResult, data);
        }
    }
}
