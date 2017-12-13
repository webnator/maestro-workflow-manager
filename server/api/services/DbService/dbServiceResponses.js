'use strict';

function makeResponses({responseService}) {
  return {
    general_error: responseService.createInternalResponse(500, '50000', 'Internal library Error'),
    internal_ddbb_error: responseService.createInternalResponse(500, '50001', 'Internal DDBB Error'),
    connection_ddbb_error: responseService.createInternalResponse(500, '50002', 'Connection database error'),
    entity_exists: responseService.createInternalResponse(409, '40900', 'Entity already exists in the DDBB'),
    some_entity_exists: responseService.createInternalResponse(409, '40901', 'Some entity already exists in the DDBB'),
    resourceNotFound: responseService.createInternalResponse(404, '40400', 'Resource not found'),
    condition_not_found: responseService.createInternalResponse(400, '40000', 'Condition not founded at remove')
  };
}

module.exports = makeResponses;
