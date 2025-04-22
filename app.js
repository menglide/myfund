// server.js
import express from 'express'
import axios from 'axios'
import pkg from 'iconv-lite';
import { calcFixedPriceNumber, formatNumber, formatLabelString, sortData } from './utils.js';

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // 允许所有源访问
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/stock', async (req, res) => {
  let aStockCount = 0;
  let usStockCount = 0;
  let hfStockCount = 0;
  let noDataStockCount = 0;
  let stockList = [];
  const code = req.query.code || 'sh601006';
  const url = `https://hq.sinajs.cn/list=${code}`;

  try {
    const resp = await axios.get(url, {
      headers: {
        Referer: 'https://finance.sina.com.cn', // 关键：伪装 Referer
      },
      responseType: 'arraybuffer',
      transformResponse: [
        (data) => {
          const body = pkg.decode(data, 'GB18030');
          return body;
        },
      ],
    });


    const splitData = resp.data.split(';\n');
    const stockPrice = {};

    for (let i = 0; i < splitData.length - 1; i++) {
      const code = splitData[i].split('="')[0].split('var hq_str_')[1];
      const params = splitData[i].split('="')[1].split(',');
      let type = code.substr(0, 2) || 'sh';
      let symbol = code.substr(2);
      let stockItem;
      let fixedNumber = 2;
      if (params.length > 1) {
        if (/^(sh|sz|bj)/.test(code)) {
          // A股
          let open = params[1];
          let yestclose = params[2];
          let price = params[3];
          let high = params[4];
          let low = params[5];
          fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low);
          const profitData = stockPrice[code] || {};
          const heldData = {};
          if (profitData.amount) {
            // 表示是持仓股
            heldData.heldAmount = profitData.amount;
            heldData.heldPrice = profitData.unitPrice;
          }
          stockItem = {
            code,
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[8], 2),
            amount: formatNumber(params[9], 2),
            time: `${params[30]} ${params[31]}`,
            percent: '',
            ...heldData,
          };
          aStockCount += 1;
        } else if (/^gb_/.test(code)) {
          symbol = code.substr(3);
          let open = params[5];
          let yestclose = params[26];
          let price = params[1];
          let high = params[6];
          let low = params[7];
          fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low);
          stockItem = {
            code,
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[10], 2),
            amount: '无数据',
            percent: '',
          };
          type = code.substr(0, 3);
          noDataStockCount += 1;
        } else if (/^usr_/.test(code)) {
          symbol = code.substr(4);
          let open = params[5];
          let yestclose = params[26];
          let price = params[1];
          let high = params[6];
          let low = params[7];
          fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low);
          const profitData = stockPrice[code] || {};
          const heldData = {};
          if (profitData.amount) {
            // 表示是持仓股
            heldData.heldAmount = profitData.amount;
            heldData.heldPrice = profitData.unitPrice;
          }
          stockItem = {
            code,
            name: params[0],
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(params[10], 2),
            amount: '无数据',
            percent: '',
            ...heldData
          };
          type = code.substr(0, 4);
          usStockCount += 1;
        } else if (/hf_/.test(code)) {
          // 海外期货格式
          // 0 当前价格
          // ['105.306', '',
          //  2  买一价  3 卖一价  4  最高价   5 最低价
          // '105.270', '105.290', '105.540', '102.950',
          //  6 时间   7 昨日结算价  8 开盘价  9 持仓量
          // '15:51:34', '102.410', '103.500', '250168.000',
          // 10 买 11 卖 12 日期      13 名称  14 成交量
          // '5', '2', '2022-05-04', 'WTI纽约原油2206', '28346"']
          // 当前价格
          let price = params[0];
          // 名称
          let name = params[13];
          let open = params[8];
          let high = params[4];
          let low = params[5];
          let yestclose = params[7]; // 昨收盘
          let yestCallPrice = params[7]; // 昨结算
          let volume = params[14].slice(0, -1); // 成交量。slice 去掉最后一位 "
          fixedNumber = calcFixedPriceNumber(open, yestclose, price, high, low);

          stockItem = {
            code: code,
            name: name,
            open: formatNumber(open, fixedNumber, false),
            yestclose: formatNumber(yestclose, fixedNumber, false),
            yestcallprice: formatNumber(yestCallPrice, fixedNumber, false),
            price: formatNumber(price, fixedNumber, false),
            low: formatNumber(low, fixedNumber, false),
            high: formatNumber(high, fixedNumber, false),
            volume: formatNumber(volume, 2),
            amount: '无数据',
            percent: '',
          };
          type = 'hf_';
          hfStockCount += 1;
        }
        if (stockItem) {
          const { yestclose, open } = stockItem;
          let { price } = stockItem;
          /*  if (open === price && price === '0.00') {
          stockItem.isStop = true;
        } */

          // 竞价阶段部分开盘和价格为0.00导致显示 -100%
          try {
            if (Number(open) <= 0) {
              price = yestclose;
            }
          } catch (err) {
            console.error(err);
          }
          stockItem.showLabel = true;
          stockItem.isStock = true;
          stockItem.type = type;
          stockItem.symbol = symbol;
          stockItem.updown = formatNumber(+price - +yestclose, fixedNumber, false);
          stockItem.percent =
            (stockItem.updown >= 0 ? '+' : '-') +
            formatNumber((Math.abs(stockItem.updown) / +yestclose) * 100, 2, false);
          stockList.push(stockItem);
        }
      } else {
        // 接口不支持的
        noDataStockCount += 1;
        stockItem = {
          id: code,
          name: `接口不支持该股票 ${code}`,
          showLabel: true,
          isStock: true,
          percent: '',
          type: 'nodata',
          contextValue: 'nodata',
        };
        stockList.push(stockItem);
      }
    }
    res.send(stockList);
  } catch (err) {
    res.status(500).send('代理请求失败: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('代理服务启动：http://localhost:3000/stock?code=sh601006');
});
