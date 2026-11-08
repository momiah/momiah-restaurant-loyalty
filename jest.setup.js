// Official in-memory AsyncStorage mock (used by Firebase Auth's RN persistence).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
// React Native defines `self` at startup (Libraries/Core/setUpGlobals.js); the jest
// preset doesn't, and firebase/functions reads it on import.
if (global.self === undefined) global.self = global;
