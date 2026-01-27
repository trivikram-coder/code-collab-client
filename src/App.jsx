import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Auth = lazy(() => import("./components/auth/Auth"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const EditorMain = lazy(() => import("./components/EditorMain"));

const Loader = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" />
  </div>
);

const App = () => (
  <BrowserRouter>
    <ToastContainer position="top-center" autoClose={3000} />
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:roomId" element={<EditorMain />} />
          
        </Route>
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
