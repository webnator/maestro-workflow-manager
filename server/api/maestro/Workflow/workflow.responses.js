'use strict';

function makeWfResponses({ResponsesService}) {
  return {
    wf_template_retrieved_ok: ResponsesService.createInternalResponse(200, '20000', 'Worflow template retrieved successfully'),

    wf_template_deleted_ok: ResponsesService.createInternalResponse(200, '20001', 'Worflow template deleted successfully'),

    wf_process_started_ok: ResponsesService.createInternalResponse(200, '20002', 'Worflow process started successfully'),

    wf_process_informed_ok: ResponsesService.createInternalResponse(200, '20003', 'Worflow process step completed successfully'),

    wf_retrieved_ok: ResponsesService.createInternalResponse(200, '20004', 'Worflows processes retrieved successfully'),

    wf_template_created_ok: ResponsesService.createInternalResponse(201, '20100', 'Worflow template created successfully'),

    wf_template_updated_ok: ResponsesService.createInternalResponse(201, '20101', 'Worflow template updated successfully'),

    no_templates_found_ko: ResponsesService.createInternalResponse(400, '40000', 'No workflow template was found with the specified parameters'),

    workflow_already_completed_ko: ResponsesService.createInternalResponse(400, '40001', 'The workflow cant continue because is already completed'),

    no_workflow_found_ko: ResponsesService.createInternalResponse(400, '40000', 'No workflow process was found'),

    ddbb_error: ResponsesService.createInternalResponse(500, '50000', 'Error connecting to the DDBB'),
  };
}

module.exports = makeWfResponses;
