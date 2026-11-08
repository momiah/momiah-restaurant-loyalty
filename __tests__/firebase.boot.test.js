// The real Firebase SDK must initialise under React Native (auth persistence +
// functions), or the app crashes on launch.
it("initialises Firestore, Auth and Functions", () => {
  const { app, db, auth, functions } = require("../config/firebase");
  expect(app.options.projectId).toBe("menudock-platform");
  expect(db).toBeTruthy();
  expect(auth).toBeTruthy();
  expect(functions.region).toBe("us-central1");
});
