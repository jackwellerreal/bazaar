import { PanoramaBackground } from "../../components/panorama";
import "./styles.css";

export function HomePage() {
    return (
        <>
            <PanoramaBackground />
            <div className="home-page">
                <header>
                    <h1>Bazaar</h1>

                    <a href="/game">
                        <span>Start Flipping</span>
                    </a>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 496 512"
                        onClick={() =>
                            window.open(
                                "https://github.com/jackwellerreal/bazaar",
                                "_blank"
                            )
                        }
                    >
                        <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
                    </svg>
                </header>
                <main className="home-grid">
                    <div className="home-grid-item">
                        <div>
                            <h2>About</h2>
                            <hr />
                            <p>
                                This is a simulator for the Bazaar from Hypixel
                                Skyblock. The point of this is to allow players
                                to practice bazaar flipping without using
                                in-game coins. It is not affiliated with Hypixel
                                in any way and any trades made here will not
                                affect your Hypixel Skyblock profile.
                            </p>
                        </div>
                        <br />
                        <br />
                        <div>
                            <h2>How to use</h2>
                            <hr />
                            <p>
                                To start flipping, click on the button in the
                                nagivation bar. You can use the replica of the
                                in game GUI to buy and sell items. The price
                                data is fetched from the Hypixel Bazaar API, so
                                it should be accurate to the current bazaar
                                prices.
                            </p>
                        </div>
                        <br />
                        <br />
                        <div>
                            <h2>Credits</h2>
                            <hr />
                            <p>
                                This project is made by{" "}
                                <a
                                    href="https://github.com/jackwellerreal/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Jack Weller
                                </a>{" "}
                                and is open source. You can find the source code
                                on{" "}
                                <a
                                    href="https://github.com/jackwellerreal/bazaar"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub
                                </a>
                                . Thanks to the Hypixel team for allowing
                                developers to use their API, and to the Furfsky
                                Reborn contributors for the GUI emements. Lastly
                                thanks to Dante for being the best mayor in
                                Hypixel Skyblock history.
                            </p>
                        </div>
                    </div>
                    <div className="home-grid-item">
                        <div>
                            <h2>Tips</h2>
                            <hr />
                            <ul>
                                <li>
                                    <strong>Buy low, sell high:</strong> The key
                                    to flipping is to buy items at a low price
                                    and sell them at a higher price.
                                </li>
                                <li>
                                    <strong>Check the price history:</strong>{" "}
                                    Use websites like{" "}
                                    <a
                                        href="https://skyblock.bz/"
                                        target="_blank"
                                    >
                                        skyblock.bz
                                    </a>{" "}
                                    to check the price history of items. If the
                                    average price is normally higher than the
                                    current price, it might be a good time to
                                    buy.
                                </li>
                                <li>
                                    <strong>Buy strategically:</strong> Don't
                                    spend all your coins on a one trade, even if
                                    it looks like a good deal. Doing so will
                                    leave you with nothing if it goes wrong.
                                </li>
                                <li>
                                    <strong>Be patient:</strong> Most of the
                                    time when flipping, your orders will not
                                    fill instantly. Be patient and wait for the
                                    orders to fill. If you are impatient, you
                                    might end up selling at a loss.
                                </li>
                            </ul>
                        </div>
                        <br />
                        <br />
                    </div>
                </main>
            </div>
        </>
    );
}
