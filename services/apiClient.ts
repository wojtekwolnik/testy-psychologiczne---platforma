
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
export const fetchTestById = async () => null;
export const submitTest = async () => ({});
export const fetchResultById = async () => null;
export const fetchPdfTemplates = async () => [];
export const getAiInterpretation = async () => ({ interpretation: 'Mock AI interpretation' });
