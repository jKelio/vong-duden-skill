'use strict';

const Alexa = require('ask-sdk');
const vongGeneratorService = require('../../services/vongGenerator/vongGeneratorService.factory').createVongGeneratorService();
const format = require('string-format');

class TranslateVongHandler {
    constructor() {}
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.intent.name === 'TranslateVongIntent';
    }
    handle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributesManager = handlerInput.attributesManager;
        const requestAttributes = attributesManager.getRequestAttributes();
        const persistentAttributes = attributesManager.getPersistentAttributes();
        const responseBuilder = handlerInput.responseBuilder;

        if (request.dialogState != "COMPLETED") {
            return responseBuilder.addDelegateDirective().withShouldEndSession().getResponse();
        }

        let translatingText = "";

        if (request.intent.slots.TranslatingText.value && request.intent.slots.TranslatingText.value !== "?") {
            translatingText = request.intent.slots.TranslatingText.value;
        }

        return vongGeneratorService.fetchTranslatedVongText(translatingText).then(translatedText => {
            const vongImageUrl = vongGeneratorService.generateVongImageUrl(encodeURI(translatedText));

            let outputSpeech = requestAttributes.t('TRANSLATION');
            outputSpeech = format(outputSpeech, {
                translatingText: translatingText,
                translatedText: translatedText,
                promptAgain: requestAttributes.t('TRANSLATION_PROMPT_AGAIN')
            });

            let cardBody = `${requestAttributes.t('TRANSLATING_TEXT')}\n${translatingText}\n\n${requestAttributes.t('TRANSLATED_TEXT')}\n${translatedText}`;

            let response = responseBuilder
                .speak(outputSpeech)
                .withShouldEndSession(false)
                .withStandardCard(requestAttributes.t('SKILL_NAME'), cardBody, vongImageUrl);

            if (this.supportsDisplay(handlerInput) || this.isSimulator(handlerInput)) {
                console.log('device supports a disply');
                const templateBackground = new Alexa.ImageHelper()
                    .withDescription('Vong Duden - Dein Vong Translator')
                    .addImageInstance('https://s3-eu-west-1.amazonaws.com/vong-duden/images/duden-1427114.jpg')
                    .getImage();

                const templateImage = new Alexa.ImageHelper()
                    .withDescription('Vong Duden - Dein Vong Translator')
                    .addImageInstance(vongImageUrl)
                    .getImage();
                const templateTextContent = new Alexa.RichTextContentHelper()
                    .withPrimaryText(`<b>${requestAttributes.t('TRANSLATING_TEXT')}</b><br />${translatingText}<br /><br /><b>${requestAttributes.t('TRANSLATING_TEXT')}</b><br />${translatedText}`)
                    .getTextContent();
                response = response.addRenderTemplateDirective({
                    "type": "BodyTemplate2",
                    "token": "TRANSLATION",
                    "backButton": "VISIBLE",
                    "backgroundImage": templateBackground,
                    "title": requestAttributes.t('SKILL_NAME'),
                    "image": templateImage,
                    "textContent": templateTextContent
                });
            }

            response = response.getResponse();

            let todayDate = new Date().toISOString();

            return new Promise((resolve, reject) => {
                persistentAttributes.then((attributes) => {
                    attributes['lastTranslatingText'] = translatingText;
                    attributes['lastTranslatedText'] = translatedText;
                    attributes['lastTranslationDate'] = todayDate;

                    if (attributes['history'] && attributes['history'].length) {
                        attributes['history'].push({
                            translatingText: translatingText,
                            translatedText: translatedText,
                            translationDate: todayDate
                        });
                    }
                    else {
                        attributes['history'] = [{
                            translatingText: translatingText,
                            translatedText: translatedText,
                            translationDate: todayDate
                        }];
                    }

                    attributesManager.setPersistentAttributes(attributes);
                    return handlerInput.attributesManager.savePersistentAttributes();
                }).then(() => {
                    resolve(response);
                });
            });
        }).catch(err => {
            console.log(err);
            throw err;
        });
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

    isSimulator(handlerInput) {
        const isSimulator = !handlerInput.requestEnvelope.context;
        return isSimulator;
    }
}
module.exports = TranslateVongHandler;
