import "./App.css";

import React from "react";
import { Toaster } from "react-hot-toast";
import UserRouter from "./route";

function App() {
  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: "8px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
      <UserRouter />
    </>
  );
}

export default App;
