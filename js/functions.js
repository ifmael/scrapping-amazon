export const getPriceFromString = (priceString) => {
  const priceSplit = priceString.split(' ');
  return  Number(priceSplit[0]) || Number(priceSplit[1])
};