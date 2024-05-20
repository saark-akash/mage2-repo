define([
    'jquery',
    'underscore',
    'mage/translate'
], function ($, _, $t) {
    'use strict';

    return function (SwatchRenderer) {
        
        $.widget('mage.SwatchRenderer', SwatchRenderer, {
            /**
             * Update [gallery-placeholder] or [product-image-photo]
             * @param {Array} images
             * @param {jQuery} context
             * @param {Boolean} isInProductView
             */
            updateBaseImage: function (images, context, isInProductView) {
                var self = this.options.jsonConfig.customConfig; //Load Custom Content Config.

                ///Check if linkUrl is empty//
                if (self.linkUrl == "" || self.linkUrl == null) {
                    return this._super(images, context, isInProductView);
                }
                /////

                var justAnImage = images[0],
                    initialImages = this.options.mediaGalleryInitial,
                    imagesToUpdate,
                    gallery = context.find(this.options.mediaGallerySelector).data('gallery'),
                    isInitial;

                if (isInProductView) {
                    if (_.isUndefined(gallery)) {
                        context.find(this.options.mediaGallerySelector).on('gallery:loaded', function () {
                            this.updateBaseImage(images, context, isInProductView);
                        }.bind(this));

                        return;
                    }

                    imagesToUpdate = images.length ? this._setImageType($.extend(true, [], images)) : [];
                    isInitial = _.isEqual(imagesToUpdate, initialImages);

                    if (this.options.gallerySwitchStrategy === 'prepend' && !isInitial) {
                        //Remove Additional Extra Content
                        initialImages = this._removeExtraContentfromArray(initialImages);
                        //////////////
                        imagesToUpdate = imagesToUpdate.concat(initialImages);
                    }

                    imagesToUpdate = this._setImageIndex(imagesToUpdate);

                    gallery.updateData(imagesToUpdate);
                    this._addFotoramaVideoEvents(isInitial);
                } else if (justAnImage && justAnImage.img) {
                    context.find('.product-image-photo').attr('src', justAnImage.img);
                }
            },

            /**
             * Callback which fired after gallery gets initialized.
             *
             * @param {HTMLElement} element - DOM element associated with a gallery.
             */
            _onGalleryLoaded: function (element) {
                var galleryObject = element.data('gallery');

                ////////////
                var currImgs = galleryObject.returnCurrentImages();
            
                //Load Extra Content//
                this._loadExtraContent();

                //Push Extra Content in images gallery
                var self = this.options.jsonConfig.customConfig;
                var modelThumbnailImg = self.thumbnailImage;
                
                this._pushExtraContent(currImgs, modelThumbnailImg);
                //////////////////

                this.options.mediaGalleryInitial = currImgs;

                ///Update Current Images in Media Gallery///
                galleryObject.updateData(currImgs);
            },

            /**
             * Load media gallery using ajax or json config.
             *
             * @private
             */
            _loadMedia: function () {
                var self = this.options.jsonConfig.customConfig; //Get Custom Config.

                var $main = this.inProductList ?
                        this.element.parents('.product-item-info') :
                        this.element.parents('.column.main'),
                    images;

                if (this.options.useAjax) {
                    this._debouncedLoadProductMedia();
                }  else {
                    images = this.options.jsonConfig.images[this.getProduct()];

                    if (!images) {
                        images = this.options.mediaGalleryInitial;
                    }

                    ////////////Load Extra Content/////
                    this._loadExtraContent();
                    //Remove Extra Content from image array
                    images = this._removeExtraContentfromArray(images);

                    var self = this.options.jsonConfig.customConfig;
                    var modelThumbnailImg = self.thumbnailImage;
                    
                    //Push Extra Content from image array
                    this._pushExtraContent(images, modelThumbnailImg);
                    //////////////////
            
                    this.updateBaseImage(this._sortImages(images), $main, !this.inProductList);
                }
            },


            /**
             * Delete Additional Extra Content from array
             * 
             * @param {Array} imagesArray
             * @returns {Array}
             * @private
             */
            _removeExtraContentfromArray: function(imagesArray) {
                imagesArray = imagesArray.filter(element => element.type !== "ExtraContent");
                return imagesArray;
            },

            /**
             * Push Extra Content in array
             * 
             * @param {Array} fotoramaContentArray
             * @param {string} modelThumbnailImg
             * @private
             */
            _pushExtraContent: function(fotoramaContentArray, modelThumbnailImg) {
                var self = this.options.jsonConfig.customConfig;

                if (typeof fotoramaContentArray != "undefined" && 
                    (self.linkUrl != "" || self.linkUrl != null)) {
                        fotoramaContentArray.unshift({
                        thumb: modelThumbnailImg,
                        src: self.linkUrl,
                        type: 'ExtraContent',
                        caption: self.linkContent,
                        isMain: "true",
                        position: 0
                    });
                }
            },

            /**
             * Get Selected Variant Value
             * 
             * @return {string}
             * @private
             */
            _getSelectedVariantValue: function() {
                var self = this.options.jsonConfig.customConfig;
                var optionTextVal = "";
                var optionTextArr = []; 
                var selectedText = "";
                var selectedVal = "";
                var selectedSwatchAttrId = 0;
                var defaultVariantAttribute = self.defaultVariantAttribute;
            
                if ($('.product-options-wrapper select[id^="attribute"]').find().length) {
                    selectedText = $('.product-options-wrapper select[id^="attribute"] option:selected').text();
                } else {
                    if ($('.swatch-attribute-options .swatch-option[aria-checked="true"]').length) {
                        var swatchId = "";
                        var idParts = [];
                        $('.swatch-attribute-options .swatch-option[aria-checked="true"]').each(function() {
                            swatchId = $(this).attr("id");
                            idParts = swatchId.split('-');

                            for (let index=0; index<idParts.length; index++) {
                                if ($.isNumeric(idParts[index])) {
                                    selectedSwatchAttrId = idParts[index];
                                    break;
                                }
                            }
                            if (parseInt(defaultVariantAttribute) == selectedSwatchAttrId) {
                                selectedText = $(this).attr("data-option-label");
                            }
                        });
                    }
                }

                /////Get Selected Variant Value/////
                selectedVal = $('.product-options-wrapper select[id^="attribute"] option:selected').val();
                if (selectedVal == "" && $('.product-options-wrapper select[id^="attribute"]').find().length) {
                    selectedText = $('.product-options-wrapper select[id^="attribute"] option:eq(1)').text();
                } else {
                    selectedVal = selectedText;
                }
                /////

                if ($('.product-options-wrapper select[id^="attribute"]').find().length) {
                    if (selectedText.indexOf('+') == -1) {
                        optionTextVal = selectedText;
                    } else {
                        optionTextArr =  selectedText.split('+');
                        optionTextVal = $.trim(optionTextArr[0]);
                    }    
                } else {
                    optionTextVal = selectedVal;
                }
              
                return optionTextVal;
            },


            /**
             * Event for swatch options
             *
             * @param {Object} $this
             * @param {Object} $widget
             * @private
             */
            _OnClick: function ($this, $widget) {
                var self = this.options.jsonConfig.customConfig;
                var testExtraContentDiv = $("#testExtraContent");
                var mainVariantAttributeId = self.defaultVariantAttribute;

                var swatchId = $this.attr("id");
                var idParts = swatchId.split('-');
                var selectedSwatchAttrId = 0;

                for (let index=0; index<idParts.length; index++) {
                    if ($.isNumeric(idParts[index])) {
                        selectedSwatchAttrId = idParts[index];
                        break;
                    }
                }
                
                if (typeof testExtraContentDiv == "object" 
                    && selectedSwatchAttrId == parseInt(mainVariantAttributeId)) {
                        var label = $this.attr("data-option-label");
                        var bgColor = "#86FA50";

                        switch (label) {
                            case 'Gold': bgColor = "#DFD906"; break;
                            case 'Diamond': bgColor = "#AFF3F2"; break;
                        }

                        setTimeout(function(){
                            $("#testExtraContent").css("background-color", bgColor);
                        }, 300);
                        
                }

                this._super($this, $widget);
            },

            /**
             * Load Extra Content
             * 
             * @private
             */
            _loadExtraContent: function() {
                var thisJs = this;
                var self = this.options.jsonConfig.customConfig;
                var divFotorama = $('div.gallery-placeholder > div.fotorama');

                if (self.linkUrl == "") {
                    return;
                }
                var variantText = "None";
                 
                //Get Selected Variant Value
                variantText = thisJs._getSelectedVariantValue();

                divFotorama.on('fotorama:load', function fotorama_onLoad(e, fotorama, extra) {

                    if (extra.frame.type === 'ExtraContent' && extra.frame.src != "") {
                        var extraContentHtml = '';
                       
                        extraContentHtml += '<div id="testExtraContent" style="background-color:#86FA50">';
                        extraContentHtml += '<h1 style="margin-top:250px">'+'Extra Content'+'</h1>';
                        ///Show Variant Text///
                        if (variantText != '') {
                            extraContentHtml += '<p style="font-size:20px">Selected Variant:</p>';
                            extraContentHtml += '<p style="font-size:18px">'+variantText+'</p><br/>';
                        }
                        /////////////////
                        extraContentHtml += '<a href="'+self.linkUrl+'" style="font-size:18px">'
                        extraContentHtml += self.linkContent+'</a>';
                        extraContentHtml += '</div>';

                        extra.frame.$stageFrame.html(extraContentHtml);
                    }
                });
            }

        });

        return $.mage.SwatchRenderer;
    };
});