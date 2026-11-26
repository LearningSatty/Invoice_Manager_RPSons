const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
];

const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const scales = ['', 'Thousand', 'Lakh', 'Crore', 'Arab', 'Kharab', 'Neel'];

function underThousandToWords(value) {
  const words = [];
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  if (hundreds) words.push(`${ones[hundreds]} Hundred`);
  if (remainder < 20 && remainder > 0) {
    words.push(ones[remainder]);
  } else if (remainder >= 20) {
    const unit = remainder % 10;
    words.push(`${tens[Math.floor(remainder / 10)]}${unit ? ` ${ones[unit]}` : ''}`);
  }

  return words.join(' ');
}

function integerToIndianWords(value) {
  if (value === 0) return 'Zero';

  const groups = [value % 1000];
  value = Math.floor(value / 1000);
  while (value > 0) {
    groups.push(value % 100);
    value = Math.floor(value / 100);
  }

  return groups
    .map((group, index) => {
      if (!group) return '';
      const words = underThousandToWords(group);
      return scales[index] ? `${words} ${scales[index]}` : words;
    })
    .filter(Boolean)
    .reverse()
    .join(' ');
}

export function amountToWords(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return '';

  const totalPaise = Math.round((numericAmount + Number.EPSILON) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (!Number.isSafeInteger(rupees) || rupees >= 100000000000000) return '';

  const rupeeWords = integerToIndianWords(rupees);
  const paiseWords = paise ? ` and Paise ${integerToIndianWords(paise)}` : '';
  return `Rupees ${rupeeWords}${paiseWords} Only`;
}
