
// This is the API client for the front-end.
// It will make fetch requests to the server's API endpoints.

export const getSetupStatus = async () => ({ needsSetup: false });
export const createFirstAdminUser = async () => ({});
export const findUserByEmail = async () => null;
export const authenticateUser = async () => null;
export const getUserById = async () => null;
export const getAllUsers = async () => [];
export const getTestById = async () => null;
export const getTestByCanonicalId = async () => null;
export const createTestResult = async () => ({});
export const getTestResultById = async () => null;
export const getAccessCode = async () => null;
export const createAccessCode = async () => ({});
export const markAccessCodeAsUsed = async () => ({});
export const getNotificationsForUser = async () => [];
export const getAllPdfTemplates = async () => [];
export const getAppSettings = async () => null;
export const updateAppSettings = async () => ({});
export const fetchNotifications = async () => [];
export const getTestIdForCode = async () => null;
export const fetchTests = async () => [];
export const fetchTestVersions = async () => [];
export const fetchResults = async () => [];
export const generateAccessCode = async () => ({ code: 'MOCKCODE' });
export const fetchActiveCodes = async () => [];
export const deleteResult = async () => ({});
export const checkTestStatus = async () => ({ status: 'new' });
export const fetchTestById = async (testId: string) => null;
export const submitTest = async () => ({});
export const fetchResultById = async () => null;
export const fetchPdfTemplates = async () => [];
export const getAiInterpretation = async () => ({ interpretation: 'Mock AI interpretation' });

// Placeholder function to allow the TestEditor to build.
export const saveTest = async (test: any, asNewVersion: boolean) => {
  console.warn('NOTE: `saveTest` is a mock function. It does not actually save the test to the server yet.', { test, asNewVersion });
  // The component expects the saved test object to be returned.
  return test;
};

// Placeholder functions for UserManagement
export const saveUser = async (user: any) => {
  console.warn('NOTE: `saveUser` is a mock function. It does not actually save the user.', { user });
  return user;
};

export const deleteUser = async (userId: string) => {
  console.warn('NOTE: `deleteUser` is a mock function. It does not actually delete the user.', { userId });
  return {};
};

// Placeholder functions for AggregatedDataView
export const fetchTestsForAggregation = async () => {
    console.warn('NOTE: `fetchTestsForAggregation` is a mock function.');
    return [];
};

export const fetchDetailedAggregatedDataForTest = async (testId: string) => {
    console.warn('NOTE: `fetchDetailedAggregatedDataForTest` is a mock function.', { testId });
    return { scales: [], scoreDistribution: {}, answerFrequency: {} };
};

export const fetchPsychometricData = async (testId: string) => {
    console.warn('NOTE: `fetchPsychometricData` is a mock function.', { testId });
    return null; // Returning null will trigger the 'not enough data' message in the component
};

// Placeholder for TemplateManager
export const deletePdfTemplate = async (templateId: string) => {
    console.warn('NOTE: `deletePdfTemplate` is a mock function.', { templateId });
    return {};
};

// Placeholders for TemplateEditor
export const fetchPdfTemplateById = async (templateId: string) => {
    console.warn('NOTE: `fetchPdfTemplateById` is a mock function.', { templateId });
    return null; // The component is designed to handle a null return
};

export const savePdfTemplate = async (template: any) => {
    console.warn('NOTE: `savePdfTemplate` is a mock function.', { template });
    return template;
};

// Placeholder for HealthDashboardPage
export const runSystemHealthCheck = async (branding: any) => {
    console.warn('NOTE: `runSystemHealthCheck` is a mock function.', { branding });
    return []; // Return an empty array to indicate no issues, component will render correctly
};

// Placeholder for SideNav/NotificationBell
export const markNotificationsAsRead = async (userId: string, notificationIds: string[]) => {
    console.warn('NOTE: `markNotificationsAsRead` is a mock function.', { userId, notificationIds });
    return {};
};
