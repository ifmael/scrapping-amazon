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

const scrappeCategory = async (page,listCategories, parentCategory, targetCategories) => {
  
  for(let i=0; i < listCategories.length; i++){
    try {
      await page.goto(listCategories[i].href, { waitUntil: 'networkidle0' });
      const listProduct = await page.evaluate( async () => {
        const listProductNodes = document.querySelectorAll("#zg-ordered-list li");
        let listProduct = [];
        for(let productNode of listProductNodes){
          const numReviewProduct = Number(productNode.querySelector('.aok-inline-block.zg-item div a.a-size-small.a-link-normal').innerText);
          const priceProduct = await window.getPriceFromString(productNode.querySelector('.aok-inline-block.zg-item   a.a-link-normal.a-text-normal span span').innerText);
          if(priceProduct > 30 && numReviewProduct > 50){
            listProduct.push({
              nameProduct: productNode.querySelector('.aok-inline-block.zg-item .p13n-sc-truncated').innerText,
              numReviewProduct,
              priceProduct,
              href: productNode.querySelector('.aok-inline-block.zg-item a').href
            });
          }
        }

        return listProduct && listProduct.length > 0 && listProduct;
      });
      debugger;
      if(listProduct && listProduct.length >0){
        targetCategories.push({
          category: listProduct[i].category,
          products: listProduct,
          href: listProduct[i].href,
          parent_id: parentCategory
        })
      }

      // Get the cagegories
      debugger;
      const subCategories = await page.evaluate( async () => {
        const subCategoriesElement = document.querySelector('#zg_browseRoot ul ul');
        debugger;

      });



    } catch (error) {
      console.error(error);
    }
  }
}



/*   listCategories.reduce(async (targetCategories,category,index,array)=>{
    await page.goto(category, { waitUntil: 'networkidle0' });
    debugger;
    const listProduct = await page.evaluate( async () => {
      const listProductNodes = document.querySelectorAll("#zg-ordered-list li");
      debugger;
      let listProduct = [];
      for(let productNode of listProductNodes){
        const numReviewProduct = Number(productNode.querySelector('.aok-inline-block.zg-item div a.a-size-small.a-link-normal').innerText);
        const priceProduct = await window.getPriceFromString(productNode.querySelector('.aok-inline-block.zg-item a.a-link-normal.a-text-normal span span').innerText);
        if(priceProduct > 30 && numReviewProduct > 50){
          debugger;
          listProduct.push({
            nameProduct: productNode.querySelector('.aok-inline-block.zg-item .p13n-sc-truncated').innerText,
            numReviewProduct,
            priceProduct,
            href: productNode.querySelector('.aok-inline-block.zg-item a').href
          });
        }
      }
    }); 
    debugger;
    if(listProduct && listProduct.length >0){
      targetCategories.push({
        category: category.category,
        products: listProduct,
        href: category.href,
        parent_id: parentCategory
      })
    }

  }, targetCategories);

};
*/

(async () => {
  try {
    const browser = await puppeteer.launch({devtools: true}); // {devtools: true}
    // const browser = await puppeteer.launch(); // {devtools: true}
    const page = await browser.newPage();
    let listCategories;

    await page.exposeFunction('getPriceFromString', getPriceFromString);
    await page.goto(BESTSELLER_URL, { waitUntil: 'networkidle0' });
    
/*     await page.addScriptTag({
      path:'./js/functions.js'
    }); */

    const listCategoriesRaw = await readFile('./asserts/catetogories.json', 'utf8');

    if(!listCategoriesRaw){
      debugger;
      listCategories= await page.evaluate(() => {
        // Return a a serializable object
        const listCategoriesNodes = document.querySelector('#zg_browseRoot ul');
        const listCategories = [];
  
        for(let categoryNode of listCategoriesNodes.children){
          listCategories.push({
            category: categoryNode.innerText,
            href: categoryNode.querySelector('a').href
          })
        }
  
        return listCategories;
      });
  
      await writeFile('./asserts/catetogories.json', JSON.stringify(listCategories));
    } else {
      listCategories = JSON.parse(listCategoriesRaw);
    }
    
    const targetCategories = [];

    await scrappeCategory(page,listCategories, undefined, targetCategories);

    /* for(let i=0; i < listCategories.length; i++){

      await page.goto(listCategories[i].href, { waitUntil: 'networkidle0' });
      const listProduct = await page.evaluate( async () => {
        const listProductNodes = document.querySelectorAll("#zg-ordered-list li");
        // debugger;
        let listProduct = [];
        for(let productNode of listProductNodes){
          const numReviewProduct = Number(productNode.querySelector('.aok-inline-block.zg-item div a.a-size-small.a-link-normal').innerText);
          const priceProduct = await window.getPriceFromString(productNode.querySelector('.aok-inline-block.zg-item   a.a-link-normal.a-text-normal span span').innerText);
          if(priceProduct > 30 && numReviewProduct > 50){
            debugger;
            listProduct.push({
              nameProduct: productNode.querySelector('.aok-inline-block.zg-item .p13n-sc-truncated').innerText,
              numReviewProduct,
              priceProduct,
              href: productNode.querySelector('.aok-inline-block.zg-item a').href
            });
          }
        }
      });
      debugger;
    } */

    
    await page.close()
    await browser.close();

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
debugger; */