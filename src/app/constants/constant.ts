export const TOKEN_HEADER = 'Authorization';
export const HTTP_UNAUTHORIZED = 401;
export const HTTP_NOT_ALLOWED = 405;
export const CHROME = 'chrome';

/**********ROUTE CONSTANTS **************/
export const ROUTE_ACCOUNT_REGISTER = '/account/register';
export const ROUTE_ACCOUNT_LOGIN = '/account/login';
export const ROUTE_ACCOUNT_PROFILE = '/account/profile';
export const ROUTE_ACCOUNT_REGISTER_SUCCESS = '/account/register-success';
export const ROUTE_ACCOUNT_UNSUPPORTED_BROWSER = '/account/unsupported-browser';

/*************END**************/



/****** CUSTOM VALIDATION MESSAGE************/
export const EMAIL_REQUIRED_MESSAGE = 'Email is required.';
export const EMAIL_PATTERN_MESSAGE = 'Enter valid email.';
export const OTP_PATTERN_MESSAGE = 'Enter 6 digit OTP.';
export const OTP_REQUIRED_MESSAGE = 'OTP is required.';
export const UNAUTHORIZED_LOGIN_MESSAGE = 'We are unable to find your email, please try to register.';
export const USER_EXISTS_EXCEPTION_MESSAGE = 'A user with this email already exists.';
export const WRONG_PIN_ENTERED_MESSAGE = 'Wrong pin entered.';
export const LIMIT_EXCEEDED_EXCEPTION_MESSAGE = 'OTP limit exceeded please try after sometime.';
/************END*************/

/**** profile Personal validation messages***/
export const FIRST_NAME_REQUIRED_MESSAGE = 'First name is required.';
export const FIRST_NAME_PATTERN_MESSAGE = 'First name should only have alphabets,numbers, underscore, spaces and single quotes.';
export const FIRST_NAME_MIN_LENGTH_MESSAGE = 'First name should be at least 3 characters.';
export const FIRST_NAME_MAX_LENGTH_MESSAGE = 'First name should not be more than 30 characters.';
export const LAST_NAME_PATTERN_MESSAGE = 'Last name should only have alphabets,numbers, underscore and single quotes.';
export const LAST_NAME_MIN_LENGTH_MESSAGE = 'Last name should be at least 3 characters.';
export const LAST_NAME_MAX_LENGTH_MESSAGE = 'Last name should not be more than 30 characters.';
export const LAST_NAME_REQUIRED_MESSAGE = 'Last name is required.';
export const DOB_REQUIRED_MESSAGE = 'Date Of Birth is required.';
export const PHONE_REQUIRED_MESSAGE = 'Phone number is required.';
export const GENDER_REQUIRED_MESSAGE = 'Gender is required.';
export const DOB_PATTERN_MESSAGE = 'Enter valid date.';
export const PHONE_PATTERN_MESSAGE = 'Enter valid phone number.';
export const PROFILE_PICTURE_REQUIRED_MESSAGE = 'Profile picture is required';
export const PHONE_NUMBER_MIN_LENGTH_MESSAGE = 'Phone number should be 10 digit number.';
/********END **************/

/********Storage Key Constants */
export const USER_KEY = 'app_user';
export const USER_ID_KEY = 'USER_ID';
export const ORG_ID_KEY = 'ORG_ID';

export const USER_NAME_KEY = 'USER_NAME';
export const EMAIL_ID_KEY = 'EMAIL_ID';
export const USER_DATA = 'USER_DATA';
export const USER_DATA_KEY  = 'USER_DATA_KEY';
export const ORG_DATA_KEY  = 'ORG_DATA_KEY';

/*********Account Status Constants ************/

export const CONFIRMED = 'confirmed';
export const NOT_REGISTERED = 'not_registered';
export const UNCONFIRMED = 'unconfirmed';
export const UNKNOWN = 'unknown';

export const PROVIDER_TIN_MAP: Record<string, string> = {
    '200807794': 'Mercado Medical Practice',
    '237082074': 'GPHA',
    '273160687': 'Dr. Milbourne'
 };
