<?php
/**
 * Copyright © Akash, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
namespace Akash\PhotoramaContentConfigPDP\Plugin\ConfigurableProduct\Block;

class ConfigurableAfterGetJsonConfigPlugin
{
    /**
     * @var \Magento\Framework\App\RequestInterface
     */
    protected $request;

    /**
     * @var \Magento\Framework\Json\Helper\Data
     */
    protected $jsonHelper;

    /**
     * Initialize dependencies
     *
     * @param \Magento\Framework\Json\Helper\Data $jsonHelper
     * @param \Magento\Framework\App\RequestInterface $request
     * @return void
     */
    public function __construct(
        \Magento\Framework\Json\Helper\Data $jsonHelper,
        \Magento\Framework\App\RequestInterface $request
    ) {
        $this->request    = $request;
        $this->jsonHelper = $jsonHelper;
    }

    /**
     * Composes configuration for js
     *
     * @param \Magento\ConfigurableProduct\Block\Product\View\Type\Configurable $subject
     * @param string $resultJson
     * @return string
     */
    public function afterGetJsonConfig(
        \Magento\ConfigurableProduct\Block\Product\View\Type\Configurable $subject,
        $resultJson
    ) {
        $product = $subject->getProduct();
        //Check if request is made from product page//
        if (strtolower($this->request->getFullActionName()) == "catalog_product_view") {
            $result = $this->jsonHelper->jsonDecode($resultJson);
            /////Set Extra Configuration Data/////
            $customConfig = [];
            
            $customConfig["linkUrl"] = $subject->getProduct()->getProductUrl();
            $customConfig["thumbnailImage"] = $product->getResource()->getAttribute('image')->getFrontend()->getUrl($product);
            $customConfig["linkContent"] =  "This is the configurable product in system.";

            //set super attribute id, on which selection you want to change the content//
            $customConfig["defaultVariantAttribute"] = 234; 

            $result["customConfig"] = $customConfig;
            // echo "<pre>";
            // print_r($result);
            // die("asdadadasdadasasd");
            $resultJson = $this->jsonHelper->jsonEncode($result);

            /////////
        }
       
        return $resultJson;
    }
}