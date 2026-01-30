/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   const discountFactor = 1 - discount / 100;
   const revenue = sale_price * quantity * discountFactor;
   return revenue;


}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

//Константы для расчета бонуса 
const bonusPercentFirst = 0.15; //для 15%
const bonusPercentSecondThird = 0.1; //лля второго и третьего 10%
const bonusPercentOther = 0.05;
const bonusPercentLast = 0;


function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    if (index === 0) {
        return +(profit * bonusPercentFirst).toFixed(2);
    } else if (index === 1 || index === 2) {
        return +(profit * bonusPercentSecondThird).toFixed(2);
    } else if (index === total - 1) {
        return 0;
    } else { 
        return +(profit * bonusPercentOther).toFixed(2); 
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных

  if (
    !data ||
    !Array.isArray(data.sellers) ||
    data.sellers.lenght === 0 ||
    !Array.isArray(data.products) ||
    data.products.lenght === 0 ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.lenght === 0 
  ) {
    throw new Error("Неккоректные данные");
  }

  //проверяем есть ли опции 

  if (typeof options !== "object" || options === null) {
    throw new Error("Нет опций"); 
  }

  const { calculateRevenue, calculateBonus } = options;

  if (!calculateRevenue || !calculateBonus) {
    throw new Error("Что-то невпорядке с функциями");
  } // проверяем, чтобы функции были впорядке

  if (
    typeof calculateRevenue !== "function" ||
    typeof calculateBonus !== "function"
  ) {
    throw new Error("Проверьте опции. Должны быть указаны функции для расчёта");
  }

// @TODO: Подготовка промежуточных данных для сбора статистики

const sellerStats = data.sellers.map((seller) => ({
  id: seller.id,
  name: `${seller.first_name} ${seller.last_name}`,
  revenue: 0,
  profit: 0,
  sales_count: 0,
  products_sold: {},
}));

// @TODO: Индексация продавцов и товаров для быстрого доступа

const sellerIndex = sellerStats.reduce((acc, seller) => {
  acc[seller.id] = seller;
  return acc;
}, {});

const productIndex = data.products.reduce((acc, product) => {
  acc[product.sku] = product;
  return acc;
}, {});

// @TODO: Расчёт выручки и прибыли для каждого продавца

data.purchase_records.forEach(record => { //чек
 const seller = sellerIndex[record.seller_id]; //продавец
 if(!seller) return;
 seller.sales_count +=1; //увеличить кол-во продаж
 seller.revenue += record.total_amount; //увеличить общую сумму выручки всех продаж 

  
  
  //расчёт прибыли для каждого товара 
  record.items.forEach(item => {
    const product = productIndex[item.sku]; //товар 
    if (!product) return;
    const cost = product.purchase_price * item.quantity;
    const revenue = calculateRevenue(item, product);
    const profit = revenue - cost;
    seller.profit += profit;

    if (!seller.products_sold[item.sku]) {
      seller.products_sold[item.sku] = 0;
    }

    seller.products_sold[item.sku] += item.quantity;
  });
});

// @TODO: Сортировка продавцов по прибыли

sellerStats.sort((a, b) => b.profit - a.profit);// сортируем продавцов

// @TODO: Назначение премий на основе ранжирования

sellerStats.forEach((seller, index) => {
  seller.bonus =  calculateBonus(index, sellerStats.lenght, seller);//считаем бонус 
  seller.top_products =Object.entries(seller.products_sold)
  .map(([sku, quantity]) => ({sku, quantity}))
  .sort((a, b) => b.quantity - a.quantity)
  .slice(0, 10); //формируем топ 10 товаров 
});


// @TODO: Подготовка итоговой коллекции с нужными полями
return sellerStats.map((seller) => ({
    seller_id: String(seller.id),
    name: String(seller.name),
    revenue: +seller.revenue.toFixed(2),
    profit: +seller.profit.toFixed(2),
    sales_count: seller.sales_count,
    top_products: seller.top_products,
    bonus: +seller.bonus.toFixed(2),
  }));

}
