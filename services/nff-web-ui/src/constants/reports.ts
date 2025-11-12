export const REPORT_CONSTANTS = {
  LOADING_MIN_DURATION: 1200,
  SECTION_ADD_DELAY: 300,
  SECTION_LOAD_DELAY: 500,
  TOAST_DURATION: 3000,
} as const;

export const REPORT_UI_TEXT = {
  PLACEHOLDERS: {
    REPORT_TYPE: "Choose report type...",
    REPORT_SUMMARY: "Enter report description or overview...",
    REPORT_TITLE_EDIT: "Enter report title...",
    SECTION_TITLE_EDIT: "Enter section title...",
  },
  BUTTONS: {
    GENERATE: "Confirm Generate",
    GENERATING: "Generating...",
    ADD_SECTION: "Add New Section",
    ADDING_SECTION: "Adding Section...",
    ADD_BLOCK: "Add New block",
    ADD_NEW_BLOCK: "Add New Block",
    SAVE: "Save",
    CANCEL: "Cancel",
    CLEAR: "Clear",
    DELETE: "Delete",
    EDIT: "Edit",
    DUPLICATE: "Duplicate",
    ENABLE: "Enable",
    DISABLE: "Disable",
    EXPORT_JSON: "Export To JSON",
    EXPORT_REPORT: "Export Report",
    EXPORTING: "Exporting...",
    CONVERT_HTML: "Convert To HTML",
  },
  MESSAGES: {
    LOADING_REPORT_TYPES: "Loading report types...",
    LOADING_SECTIONS: "Loading sections data...",
    NO_SECTIONS: "No sections found",
    NO_BLOCKS: "No blocks available",
    NO_BLOCKS_SECTION: "No blocks in this section",
    GENERATING_REPORT: "Please wait while we create your report",
    BLANK_TEMPLATE: "Blank template will appear here",
    GENERATE_TO_SEE: "Generate a report to see the template",
    LIVE_PREVIEW: "Live Preview",
    LIVE_PREVIEW_WILL_APPEAR: "Generate a report to see the preview",
    SWITCH_SECTION: "Switch disable/enable section",
    GENERATE_TEMPLATE: "Generate a report to see the template and preview",
    SELECT_AND_GENERATE: 'Select a report type and click "Confirm Generate"',
    REPORT_NOT_FOUND:
      "The report you're looking for doesn't exist or has been deleted.",
    BACK_TO_REPORTS: "Back to Reports",
  },
  ERRORS: {
    FAILED_LOAD_REPORT_TYPES: "Failed to load report types",
    FAILED_GENERATE_REPORT: "Failed to generate report",
    FAILED_TOGGLE_SECTION: "Failed to toggle section. Please try again.",
    FAILED_TOGGLE_BLOCK: "Failed to toggle block. Please try again.",
    FAILED_DELETE_BLOCK: "Failed to delete block. Please try again.",
    FAILED_ADD_SECTION: "Failed to Add Section",
    FAILED_SAVE_TITLE: "Failed to save report title",
    FAILED_SAVE_SECTION_TITLE: "Failed to save section title",
    FAILED_EXPORT_CHART: "Failed to export chart data. Please try again.",
    FAILED_DELETE_REPORT: "Failed to delete report. Please try again.",
    FAILED_EXPORT_PDF: "Failed to export to PDF. Please try again.",
  },
  SUCCESS: {
    BLOCK_DELETED: "Block deleted successfully!",
    REPORT_DELETED: "Report deleted successfully",
    PDF_EXPORT_COMPLETED: "PDF export completed successfully",
  },
} as const;

export const REPORT_BLOCK_TYPES = {
  TEXT: "Text",
  CHART: "Chart",
  TABLE: "Table",
  BULLETS: "Bullet",
  NOTES: "Notes",
} as const;

export const REPORT_ACTIONS = {
  ENABLE: "enable",
  DISABLE: "disable",
  EDIT: "edit",
  DELETE: "delete",
  DUPLICATE: "duplicate",
  EXPORT: "export",
} as const;

export const REPORT_DIALOG_STEPS = {
  CHART: 0,
  BLOCK: 0,
} as const;

export const REPORT_LAYOUT = {
  HEADER_HEIGHT: "105px",
  FULL_HEIGHT: "calc(100vh - 105px)",
  MIN_HEIGHT: "60vh",
  PREVIEW_MIN_HEIGHT: "69vh",
  SCROLL_MAX_HEIGHT: "70vh",
} as const;
