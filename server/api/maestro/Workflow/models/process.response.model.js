'use strict';

function TemplateResponseModel(templateObject) {
  if (templateObject) {
    if (Array.isArray(templateObject)) {
      let response = [];
      templateObject.forEach((obj) => {
        response.push(templateModel(obj));
      });
      return response;
    } else {
      return templateModel(templateObject);
    }
  }
  return templateObject;
}

function templateModel(templateObject) {
  return {
    name: templateObject.name,
    tasks: templateObject.tasks
  };
}

module.exports = TemplateResponseModel;
