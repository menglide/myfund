const SortType = {
  NORMAL: 0, // 基金默认顺序
  ASC: 1, // 涨跌升序
  DESC: -1, // 涨跌降序
  AMOUNTASC: 2, // 持仓金额升序
  AMOUNTDESC: -2, // 持仓金额降序
}
export function formatLabelString(str, params) {
  try {
    str = str.replace(/\$\{(.*?)\}/gi, function (_, $1) {
      const formatMatch = /(.*?)\s*\|\s*padRight\s*(\|\s*(\d+))?/gi.exec($1);

      if (formatMatch) {
        return formatTreeText(
          params[formatMatch[1]],
          formatMatch[3] ? parseInt(formatMatch[3]) : undefined
        );
      } else {
        return String(params[$1]);
      }
    });
  } catch (err) {
    // @ts-ignore
    window.showErrorMessage(`fail: Label format Error, ${str};\n${err.message}`);
    return '模板格式错误！';
  }
  return str;
}
/**
 * toFixed 解决js精度问题，使用方式：toFixed(value)
 * @param {Number | String} value
 * @param {Number} precision 精度，默认2位小数，需要取整则传0
 * @param {Number} percent 倍增
 * 该方法会处理好以下这些问题
 * 1.12*100=112.00000000000001
 * 1.13*100=112.9999999999999
 * '0.015'.toFixed(2)结果位0.01
 * 1121.1/100 = 11.210999999999999
 */
export const toFixed = (value = 0, precision = 2, percent = 1) => {
  const num = Number(value);
  if (Number.isNaN(num)) {
    return 0;
  }
  if (num < Math.pow(-2, 31) || num > Math.pow(2, 31) - 1) {
    return 0;
  }
  let newNum = value * percent;
  // console.log(num, precision)
  if (precision < 0 || typeof precision !== 'number') {
    return newNum * percent;
  } else if (precision > 0) {
    newNum = Math.round(num * Math.pow(10, precision) * percent) / Math.pow(10, precision);
    return newNum;
  }
  newNum = Math.round(num);

  return newNum;
};

export const calcFixedPriceNumber = (open, yestclose, price, high, low) => {
  let reg = /0+$/g;
  open = open.replace(reg, '');
  yestclose = yestclose.replace(reg, '');
  price = price.replace(reg, '');
  high = high.replace(reg, '');
  low = low.replace(reg, '');
  let o = open.indexOf('.') === -1 ? 0 : open.length - open.indexOf('.') - 1;
  let yc = yestclose.indexOf('.') === -1 ? 0 : yestclose.length - yestclose.indexOf('.') - 1;
  let p = price.indexOf('.') === -1 ? 0 : price.length - price.indexOf('.') - 1;
  let h = high.indexOf('.') === -1 ? 0 : high.length - high.indexOf('.') - 1;
  let l = low.indexOf('.') === -1 ? 0 : low.length - low.indexOf('.') - 1;
  let max = Math.max(o, yc, p, h, l);
  if (max > 3) {
    max = 2; // 接口返回的指数数值的小数位为4，但习惯两位小数
  }
  return max;
};

export const formatNumber = (val = 0, fixed = 2, format = true) => {
  const num = +val;
  if (format) {
    if (num > 1000 * 10000) {
      return (num / (10000 * 10000)).toFixed(fixed) + '亿';
    } else if (num > 1000) {
      return (num / 10000).toFixed(fixed) + '万';
    }
  }
  return `${num.toFixed(fixed)}`;
};

export const sortData = (data = [], order = SortType.NORMAL) => {
  if (order === SortType.ASC || order === SortType.DESC) {
    return data.sort((a, b) => {
      const aValue = +a.info.percent;
      const bValue = +b.info.percent;
      if (order === SortType.DESC) {
        return aValue > bValue ? -1 : 1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  } else if (order === SortType.AMOUNTASC || order === SortType.AMOUNTDESC) {
    return data.sort((a, b) => {
      const aValue = a.info.amount - 0;
      const bValue = b.info.amount - 0;
      if (order === SortType.AMOUNTDESC) {
        return aValue > bValue ? -1 : 1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  } else {
    return data;
  }
};
