import { configureStore } from "@reduxjs/toolkit";
// AuthSlice is empty, removing import
// import AuthReducer from "./AuthSlice";

const store = configureStore({
  reducer: {
    // auth: AuthReducer, // AuthSlice is empty, commenting out
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
