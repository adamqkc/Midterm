require('dotenv').config();
const todosDataHelpers = require

const categoriesList= require('./categories');
const language = require('@google-cloud/language');

const client = new language.LanguageServiceClient();
const categories = categoriesList.categories;

// Modified Google API function that takes a string and returns one of four predefined categories based on the category of the string: 'To Eat', 'To Watch', 'To Read', 'To Buy'
// The API function will return 'null' if it cannot suggest any categories that matches the four predefined categories.
function suggestCategory(text) {
  const document = {
    content: text,
    type: 'PLAIN_TEXT',
  };

  let suggestedCategories = [];
  let confirmedCategory = [];

  return client
  .classifyText({ document: document })
  .then(results => {
    const classification = results[0];

    classification.categories.forEach(category => {
      suggestedCategories.push(category.name);
    });
    return suggestedCategories;
  })
  .then(suggestedCategories => {
    if (suggestedCategories.length > 0) {
      suggestedCategories.forEach((suggestedCategory) => {
        for (let property in categories) {
          categories[property].forEach((category) => {
            if (suggestedCategory === category) {
              if (confirmedCategory.length < 1) {
                confirmedCategory.push(property);
              }
            };
          });
        };
      });
      if (confirmedCategory.length === 0) {
        return null;
      } else {
        console.log(confirmedCategory);
        return confirmedCategory[0];
      }
    } else {
      return null;
    }
  })
  .catch(err => {
    console.error('ERROR:', err);
  });
}

module.exports.suggestCategory = suggestCategory;
