export const merchantSelectors = {
  hepsiburada: {
    addToCart: "button#addToCart",
    cartLink: "a[href*='sepetim']",
    couponInput: "input[name='promotionCode']",
    applyCouponButton: "button[type='submit']"
  },
  idefix: {
    addToCart: "button#add-to-cart-button",
    cartLink: "a[href*='sepet']",
    couponInput: "input[name='couponCode']",
    applyCouponButton: "button[data-test='apply-coupon']"
  }
} as const;
