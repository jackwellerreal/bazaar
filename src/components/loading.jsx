import "./styles.css";

import { PanoramaBackground } from "./panorama";

export function Loading() {
    return (
        <div className="loading-page">
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        </div>
    );
}
