<?php
namespace Test\TestDevelopment\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\App\RequestInterface;

class CustomPrice implements ObserverInterface
{
	public function execute(\Magento\Framework\Event\Observer $observer) {
		$item = $observer->getEvent()->getData('quote_item');			
		$item = ( $item->getParentItem() ? $item->getParentItem() : $item );
		$price = \Test\TestDevelopment\Pricing\Adjustment::ADJUSTMENT_VALUE; //set your price here
		$item->setCustomPrice($item->getPrice() + $price);
		$item->setOriginalCustomPrice($item->getPrice() + $price);
		$item->getProduct()->setIsSuperMode(true);
	}
}