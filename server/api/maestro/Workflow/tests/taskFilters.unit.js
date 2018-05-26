'use strict';

const resolvePath = require('object-resolve-path');

const taskFilters = require('./../taskFilters.service');

describe('taskFilters', () => {
  let filterService;
  const mockData = {
    payload: {
      field1: 'hey',
      field2: 2,
      field3: {
        a: 1, b:2, c: '3'
      },
      field4: [1,2,3],
      field5: [
        { text5a: 'a1', text5b: 'b1' },
        { text5a: 'a2', text5b: 'b2' },
        { text5a: 'a3', text5b: 'b3' }]
    }
  };

  beforeEach(() => {
    filterService = taskFilters({ resolvePath });
  });

  it('shoud delete all fields but one from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey'
      }
    };
    const filters = [{
      action: 'deleteAllButFields', fields: ['field1']
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud delete all fields but the specified ones from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey',
        field2: 2,
      }
    };
    const filters = [{
      action: 'deleteAllButFields', fields: ['field1', 'field2']
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud delete all fields if none of the specified are in the data payload', () => {
    const expectedResult = {
      payload: {}
    };
    const filters = [{
      action: 'deleteAllButFields', fields: []
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud delete only the specified fields from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey',
        field2: 2,
        field4: [1,2,3]
      }
    };
    const filters = [{
      action: 'deleteFields', fields: ['field5', 'field3']
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud rename the specified fields from the data payload', () => {
    const expectedResult = {
      payload: {
        newNamefield1: 'hey',
        field2: 2,
        newNamefield3: {
          a: 1, b:2, c: '3'
        },
        field4: [1,2,3],
        newNamefield5: [
          { text5a: 'a1', text5b: 'b1' },
          { text5a: 'a2', text5b: 'b2' },
          { text5a: 'a3', text5b: 'b3' }]
      }
    };
    const filters = [{
      action: 'renameFields', fields: [
        {name: 'field1', newName: 'newNamefield1'},
        {name: 'field3', newName: 'newNamefield3'},
        {name: 'field5', newName: 'newNamefield5'}]
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud rename the specified deep fields from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey',
        field2: 2,
        field3: {
          a: 1, b: 2, c: '3'
        },
        field4: [1,2,3],
        field5: [
          { text5a: 'a1', text5b: 'b1' },
          { text5a: 'a2', text5b: 'b2' },
          { text5a: 'a3', text5b: 'b3' }],
        newField1: 'a1',
        newField2: 2
      }
    };
    const filters = [{
      action: 'renameFields', fields: [
        {name: 'field5[0].text5a', newName: 'newField1'},
        {name: 'field3.b', newName: 'newField2'}
      ]
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud merge the specified array fields from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey',
        field2: 2,
        field3: {
          a: 1, b: 2, c: '3'
        },
        newField: [1, 2, 3, { text5a: 'a1', text5b: 'b1' },
          { text5a: 'a2', text5b: 'b2' },
          { text5a: 'a3', text5b: 'b3' }]
      }
    };
    const filters = [{
      action: 'mergeFields', fields: ['field4', 'field5'], newName: 'newField'
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud merge the specified object fields from the data payload', () => {
    const expectedResult = {
      payload: {
        field1: 'hey',
        field2: 2,
        field4: [1,2,3],
        field5: [
          { text5a: 'a1', text5b: 'b1' },
          { text5a: 'a2', text5b: 'b2' },
          { text5a: 'a3', text5b: 'b3' }],
        newField: {
          a: 1, b:2, c: '3', text5a: 'a1', text5b: 'b1'
        }
      }
    };
    const filters = [{
      action: 'mergeFields', fields: ['field3', 'field5[0]'], newName: 'newField'
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });

  it('shoud extract the specified fields from the data payload to the headers', () => {
    const expectedResult = {
      headers: {
        field1: 'hey',
        field2: 2,
      },
      payload: {
        field1: 'hey',
        field2: 2,
        field3: {
          a: 1, b:2, c: '3'
        },
        field4: [1,2,3],
        field5: [
          { text5a: 'a1', text5b: 'b1' },
          { text5a: 'a2', text5b: 'b2' },
          { text5a: 'a3', text5b: 'b3' }]
      }
    };
    const filters = [{
      action: 'extractFields', fields: ['field1', 'field2'], to: 'headers'
    }];

    const result = filterService.applyFilters(mockData, filters);
    expect(result).toEqual(expectedResult);
  });
});