const arrayToTree = require('array-to-tree');
const puppeteer = require('puppeteer');
const util = require('util');
const fs = require('fs');
const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

const BESTSELLER_URL = 'https://www.amazon.es/gp/bestsellers';


const getPriceFromString = (priceString) => {
  const priceSplit = priceString.split(/\s/);
  return  Number(priceSplit[0].replace(',','.')) || Number(priceSplit[1].replace(',','.'));
};


const getListOfCategories = async (page, levelCategory) => {
  return  await page.evaluate((levelCategory) => {
    // Return a a serializable object
    const listCategoriesNodes = document.querySelector(`#zg_browseRoot ${'ul '.repeat(levelCategory)}`);
    if(listCategoriesNodes) {
      const listCategories = [];
      for(let categoryNode of listCategoriesNodes.children){
        listCategories.push({
          category: categoryNode.innerText,
          href: categoryNode.querySelector('a').href
        })
      }
      return listCategories;
    } else {
      return null;
    }
  }, levelCategory);
};


const scrappeCategory = async (page,listCategories, parentCategory, targetCategories, levelCategory) => {
  for(let i=0; i < listCategories.length; i++){
    try {
      // debugger;
      await page.goto(listCategories[i].href, { waitUntil: 'networkidle0' });
      console.log(`category: ${listCategories[i].category}, parentCategory: ${parentCategory}, levelCategory: ${levelCategory}`);

      const listProduct = await page.evaluate( async () => {
        const listProductNodes = document.querySelectorAll("#zg-ordered-list li");
        let listProduct = [];
        let index = 1;
        for(let productNode of listProductNodes){
          console.log(`index ${index}`);
          index++;
          const nReviewElement = productNode.querySelector('.aok-inline-block.zg-item div a.a-size-small.a-link-normal');
          const nRvw = nReviewElement && nReviewElement.innerText;
          const priceElement = productNode.querySelector('.aok-inline-block.zg-item  a.a-link-normal.a-text-normal span span');
          const price = priceElement && await getPriceFromString(priceElement.innerText);
          const linkElement = productNode.querySelector('.aok-inline-block.zg-item a');
          const link = linkElement && linkElement.href;

          const numReviewProduct = nRvw !== null ? nRvw : 0;
          const priceProduct = price !== null ? price : 0;
          const linkProduct = link !== null ? link : '';
          if(priceProduct > 30 && numReviewProduct > 50){
            listProduct.push({
              nameProduct: productNode.querySelector('.aok-inline-block.zg-item .p13n-sc-truncated').innerText,
              numReviewProduct,
              priceProduct,
              href: linkProduct
            });
          }
        }
        return listProduct && listProduct.length > 0 && listProduct;
      });
      
      if(listProduct && listProduct.length >0){
        console.log(`This category has ${listProduct.length}`);
        targetCategories.push({
          category: listCategories[i].category,
          products: listProduct,
          href: listCategories[i].href,
          parent_id: parentCategory
        })
      }
      console.log(`--------------------------------------------------------`);

      // Get the cagegories
      const subCategories = await getListOfCategories(page, levelCategory);
      if(subCategories && subCategories.length > 0) {
        const newLevel = levelCategory + 1;
        await scrappeCategory(page,subCategories, listCategories[i].category, targetCategories, newLevel);
      }

    } catch (error) {
      console.error(error);
    }
  }
};


(async () => {
  try {
    // const browser = await puppeteer.launch({devtools: true, defaultViewport: null}); // {devtools: true} {defaultViewport: null}
    const browser = await puppeteer.launch(); // {devtools: true}
    const page = await browser.newPage();
    let listCategories;
    let levelCategory = 2;

   /*  await page.exposeFunction('getPriceFromString', getPriceFromString);
    await page.goto(BESTSELLER_URL, { waitUntil: 'networkidle0' });


    page.on('console', msg =>{
      for (let i = 0; i < msg.args.length; ++i)
        console.log(`${i}: ${msg.args[i]}`);
    });

    const listCategoriesRaw = await readFile('./asserts/catetogories.json', 'utf8');

    if(!listCategoriesRaw){
      listCategories = await getListOfCategories(page, levelCategory);
      ++levelCategory;
      await writeFile('./asserts/catetogories.json', JSON.stringify(listCategories));
    } else {
      listCategories = JSON.parse(listCategoriesRaw);
    }
    
    const targetCategories = [];

    await scrappeCategory(page,listCategories, undefined, targetCategories, levelCategory);
    debugger
    if(targetCategories.length > 0){
      await writeFile('./asserts/target-categories.json', JSON.stringify(targetCategories));
    }
    

    
    await page.close()
    await browser.close(); */

    const listCategoriesRaw = await readFile('./asserts/target-categories-format-parent.json', 'utf8');
    const list = JSON.parse(listCategoriesRaw)
    let index = 1;
    let filterCategies = ''
    for(let i=0 ; i <list.length ; i++){
      if(list[i].products && list[i].products.length >= 5){
        console.log(`${index} ${list[i].category}, href: ${list[i].href}`);
        filterCategies = filterCategies.concat(`${index} ${list[i].category}, href: ${list[i].href} \n`);
        // console.log(`${index} ${list[i].category}, parent category: ${list[i].parent_id}`);
        index++;
      }
    }
    console.log(`Total of categories: ${list.length}`);
    await writeFile('./asserts/filter-categories.json', filterCategies);
    //const tree = arrayToTree(list, { parentProperty: 'parent_id', customID: 'category'});

  } catch (error) {
    console.error(error);
  }
})();




/* const dataOne = [
  {
    name: 'Portfolio',
    product: [{name:'babakaba',price:'344', review: 34}],
    parent_id: undefined
  },
  {
    id: 'sub 1',
    name: 'Web Development',
    parent_id: 'Portfolio'
  },
  {
    name: 'sub 2',
    parent_id: 'Portfolio'
  },
  {
    name: 'About Me',
    parent_id: undefined
  }
];

const tree = arrayToTree(dataOne, { parentProperty: 'parent_id', customID: 'name'});
 */