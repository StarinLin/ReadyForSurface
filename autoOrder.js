// ==UserScript==
// @name         Microsoft Surface Killer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Auto order Microsoft Surface
// @author       Albresky
// @match        *://www.microsoftstore.com.cn/certified-refurbished-surface-pro-8-configurate-for-edu*
// @match        *://www.microsoftstore.com.cn/checkout/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=microsoftstore.com.cn
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";
  const _logName = "[TP Microsoft] ";
  function log(msg) {
    console.log(_logName + msg);
  }
  log("Start...");

  GM_registerMenuCommand("清除缓存", factoryReset);

  const productId = "5928";  // 产品ID [16GB/256GB]
  const colorId = "5483";    // 产品颜色 [亮铂金]

  const _itemId = "option-label-specification-185-item-" + productId;
  const _colorId = "option-label-color-93-item-" + colorId;
  const _pageUrl =
    "https://www.microsoftstore.com.cn/certified-refurbished-surface-pro-8-configurate-for-edu";
  const _cartUrl = "https://www.microsoftstore.com.cn/checkout/cart/";
  const _payUrl = "https://www.microsoftstore.com.cn/checkout/";

  let _color = null;
  let _productName = GM_getValue("_msProductName", null);
  let _itemAttibute = GM_getValue("_msItemAttribute", null);
  let stored = GM_getValue("_msStored", false);
  let _isPaying = GM_getValue("_msPaying", false);

  if (stored) {
    if (_isPaying) {
      payCart();
    } else {
      checkCart();
    }
  } else {
    main();
  }

  function factoryReset() {
    GM_deleteValue("_msStored");
    GM_deleteValue("_msItemAttribute");
    GM_deleteValue("_msPaying");
    GM_deleteValue("_msProductName");
    log("缓存已清除");
    redirect(_pageUrl);
  }

  function main() {
    if (window.location.href != _pageUrl) {
      redirect(_pageUrl);
    }
    init();
    isOnSale();
  }

  function init() {
    _productName = document.querySelector(".left-product-name").innerHTML;
    GM_setValue("_msProductName", _productName);
    let timer = setInterval(() => {
      var color = document.getElementById(_colorId);
      if (color != null) {
        if (color.ariaChecked == "false") {
          _color = color.getAttribute("option-label");
          color.click();
        }
        clearInterval(timer);
      }
    }, 500);
  }

  function isOnSale() {
    let _timer = setInterval(() => {
      let item = document.getElementById(_itemId);
      if (item) {
        if (!item.classList.contains("outofstock")) {
          log("**** " + _productName + " in stock!****");
          log(item.id + " on sale");
          stored = true;
          _itemAttibute =
            _color == null
              ? "亮铂金"
              : _color + "/" + item.getAttribute("option-label");
          GM_setValue("_msStored", stored);
          GM_setValue("_msItemAttribute", _itemAttibute);
          item.click();
          clearInterval(_timer);
        } else {
          // reload window
          log("out of stock");
          location.reload();
          log("reloading");
        }
      } else {
        log(_productName + " not found!");
      }
    }, 1000);

    log("try to add to cart...");
    let __timer = setInterval(() => {
      let submitBtn = document.getElementById("product-addtocart-button");
      if (stored && submitBtn && submitBtn.title == "加入购物车") {
        submitBtn.click();
        log("已加入购物车");
        setTimeout(() => {
          checkCart();
          clearInterval(__timer);
        }, 2000);
      }
    }, 1000);
  }

  function redirect(url) {
    window.location.href = url;
  }

  function payCart() {
    if (window.location.href != _payUrl) {
      redirect(_payUrl);
    }
    let _timer = setInterval(() => {
      let _loading = document.getElementsByClassName("loading-mask");
      if (_loading && _loading[0].style["display"] == "none") {
        log("ready to pay...");
        let ship = document.getElementsByClassName("shipping-address-items");
        if (ship && ship.length) {
          if (ship[0].childElementCount >= 2) {
            let payBtn = document.querySelector(".sub-btn>button");
            if (payBtn) {
              log("支付中...");
              payBtn.click();
              log("已支付");
              clearInterval(_timer);
            }
          } else {
            log("邮寄地址未设置!");
            return;
          }
        }
      }
    }, 1000);
  }

  function checkCart() {
    if (window.location.href != _cartUrl) {
      redirect(_cartUrl);
    }
    let _timer = setInterval(() => {
      let checkPoint1 = document.querySelector(
        ".cart-quantity>.number"
      ).innerHTML;
      if (checkPoint1 && checkPoint1 == "1") {
        log("商品数量正确!");
        clearInterval(_timer);
        checkCartDetail();
      } else {
        log("商品数量有误！");
        GM_setValue("_msStored", false);
        window.location.href = _pageUrl;
      }
    }, 500);

    function checkCartDetail() {
      let itemName = document.querySelector(
        ".product-item-details>.product-item-name>a"
      ).innerHTML;
      let itemAttibute = document.querySelector(
        ".product-item-details>.product-attributes"
      ).innerHTML;

      if (
        itemName &&
        itemAttibute &&
        _productName &&
        itemName == _productName &&
        itemAttibute == _itemAttibute
      ) {
        log("商品信息正确!");
        let checkoutBtn = document.getElementsByClassName(
          "action primary checkout"
        );
        if (checkoutBtn.length) {
          log("提交订单...");
          GM_setValue("_msPaying", true);
          checkoutBtn[0].click();
          setTimeout(() => {
            payCart();
          }, 2000);
        }
      }
    }
  }
})();
