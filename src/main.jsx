import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";

import { HomePage } from "./routes/home/index.jsx";
import { GamePage } from "./routes/game/index.jsx";
import { SignInPage } from "./routes/signin/index.jsx";

import "./styles.css";
import { Loading } from "./components/loading.jsx";

createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route index element={<HomePage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/loading" element={<Loading />} />
            <Route path="/signin" element={<SignInPage />} />
        </Routes>
    </BrowserRouter>
);
