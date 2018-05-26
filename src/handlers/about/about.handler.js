'use strict';

const Alexa = require('ask-sdk');

class AboutHandler {
    constructor() {}
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AboutIntent';
    }
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const requestAttributes = attributesManager.getRequestAttributes();

        const templateBackground = new Alexa.ImageHelper()
            .withDescription('Vong Duden - Dein Vong Translator')
            .addImageInstance('https://s3-eu-west-1.amazonaws.com/vong-duden/images/duden-1427114.jpg')
            .getImage();

        const templateImage = new Alexa.ImageHelper()
            .withDescription('Vong Duden - Dein Vong Translator')
            .addImageInstance('https://img.vong-generator.com/?message=%20Was%20isd%20vong%3F%20')
            .getImage();

        const templateTextContent = new Alexa.RichTextContentHelper()
            .withPrimaryText(requestAttributes.t('ABOUT'))
            .getTextContent();

        let response = responseBuilder
            .speak(`${requestAttributes.t('ABOUT')} ${requestAttributes.t('TRANSLATION_PROMPT')}`)
            .reprompt(requestAttributes.t('TRANSLATION_PROMPT'))
            .withShouldEndSession(false)

        if (this.supportsDisplay(handlerInput)) {
            response = response.addRenderTemplateDirective({
                "type": "BodyTemplate7",
                "token": "LAUNCH",
                "backButton": "VISIBLE",
                "backgroundImage": templateBackground,
                "title": requestAttributes.t('ABOUT_TITLE'),
                "image": templateImage,
                "textContent": templateTextContent
            });
        }

        return response.getResponse();
    }

    supportsDisplay(handlerInput) {
        const hasDisplay =
            handlerInput.requestEnvelope.context &&
            handlerInput.requestEnvelope.context.System &&
            handlerInput.requestEnvelope.context.System.device &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
            handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
        return hasDisplay;
    }
}
module.exports = AboutHandler;
