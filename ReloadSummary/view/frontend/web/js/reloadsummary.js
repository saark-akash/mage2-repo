 define([
    'jquery',
    'mage/url',
    'underscore',
    'Magento_Ui/js/form/element/abstract',
    'Magento_Checkout/js/action/get-totals',
    'mage/utils/wrapper',
    'Magento_Checkout/js/model/resource-url-manager',
    'Magento_Checkout/js/model/quote',
    'mage/storage',
    'Magento_Checkout/js/model/totals',
    'Magento_Checkout/js/model/error-processor',
    'Magento_Customer/js/customer-data',
    'uiRegistry',
], function ($, url, _, Abstract, getTotalsAction, wrapper, resourceUrlManager, quote, storage, totalsService, errorProcessor, customerData, registry) {
    'use strict';

    return Abstract.extend({
        defaults: {
            imports: {
                update: '${ $.parentName }.country_id:value'
            }
        },

        /**
         * Initializes observable properties of instance
         *
         * @returns {Abstract} Chainable.
         */
        initObservable: function () {
            this._super();
            return this;
        },

        /**
         * Method called every time country selector's value gets changed.
         * Updates all validations and requirements for certain country.
         * @param {String} value - Selected country ID.
         */
        update: function (value) {
            var ajax,
                sendTimeout,
                sendingPayload;
                var force = true;
            var serviceUrl,
                payload,
                address,
                paymentMethod,
                requiredFields = ['countryId', 'region', 'regionId', 'postcode', 'city'],
                newAddress = quote.shippingAddress() ? quote.shippingAddress() : quote.billingAddress(),
                city;
    
            serviceUrl = resourceUrlManager.getUrlForTotalsEstimationForNewAddress(quote);
            address = _.pick(newAddress, requiredFields);
            paymentMethod = quote.paymentMethod() ? quote.paymentMethod().method : null;
            
            city = '';
            if (quote.isVirtual() && quote.billingAddress()) {
                city = quote.billingAddress().city;
            } else if (quote.shippingAddress()) {
                city = quote.shippingAddress().city;
            }
    
            payload = {
                addressInformation: {
                    address: city
                }
            };    
            if (!_.isEqual(sendingPayload, payload) || force === true) {
                sendingPayload = payload;
                clearTimeout(sendTimeout);
                //delay for avoid multi request
                sendTimeout = setTimeout(function(){
                    clearTimeout(sendTimeout);
                    totalsService.isLoading(true);    
                    ajax = storage.post(
                        serviceUrl,
                        JSON.stringify(payload),
                        false
                    ).done(function (result) {
                        quote.setTotals(result);
                        // Stop loader for totals block
                        totalsService.isLoading(false);
                    }).fail(function (response) {
                        if (response.responseText || response.status) {
                            errorProcessor.process(response);
                        }
                    });
                }, 200);
            }
        }
    });
});
