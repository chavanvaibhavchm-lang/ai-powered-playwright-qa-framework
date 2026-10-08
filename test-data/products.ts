export const productNames = [
  'Sauce Labs Backpack',
  'Sauce Labs Bike Light',
  'Sauce Labs Bolt T-Shirt',
  'Sauce Labs Fleece Jacket',
  'Sauce Labs Onesie',
  'Test.allTheThings() T-Shirt (Red)',
] as const;
export const basket = [productNames[0], productNames[1]] as const;
export const customer = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '560001' };
