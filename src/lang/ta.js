'use strict';

const { createLanguage } = require('./_language');

// Indicative wording. Verify compounds, regional variants and cheque style with a native speaker.
const small = 'பூஜ்ஜியம் ஒன்று இரண்டு மூன்று நான்கு ஐந்து ஆறு ஏழு எட்டு ஒன்பது பத்து பதினொன்று பன்னிரண்டு பதின்மூன்று பதினான்கு பதினைந்து பதினாறு பதினேழு பதினெட்டு பத்தொன்பது'.split(' ');
const tens = 'இருபது முப்பது நாற்பது ஐம்பது அறுபது எழுபது எண்பது தொண்ணூறு'.split(' ');
const stems = 'இருபத்து முப்பத்து நாற்பத்து ஐம்பத்து அறுபத்து எழுபத்து எண்பத்து தொண்ணூற்று'.split(' ');
const hundreds = 'நூறு இருநூறு முந்நூறு நானூறு ஐந்நூறு அறுநூறு எழுநூறு எண்ணூறு தொள்ளாயிரம்'.split(' ');

function below100(n) {
  if (n < 20) return small[n];
  const tensIndex = Math.floor(n / 10) - 2;
  return n % 10 ? stems[tensIndex] + ' ' + small[n % 10] : tens[tensIndex];
}

module.exports = createLanguage({
  below100,
  hundred: (n, hasRest) => {
    const word = hundreds[n - 1];
    if (!hasRest) return word;
    return n === 9 ? 'தொள்ளாயிரத்து' : word.slice(0, -2) + 'ற்று';
  },
  scales: [[1e7, 'கோடி'], [1e5, 'லட்சம்'], [1e3, 'ஆயிரம்']],
  minus: 'எதிர்மறை', rupees: ['ரூபாய்', 'ரூபாய்'], paise: ['பைசா', 'பைசா'], conjunction: 'மற்றும்', only: 'மட்டும்',
});
