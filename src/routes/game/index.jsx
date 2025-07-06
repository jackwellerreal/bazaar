import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import moment from "moment";

import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    Timestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";

import { Loading } from "../../components/loading";
import { PanoramaBackground } from "../../components/panorama";
import { minecraftToHTML, rarityToCode } from "../../components/textRender";
import "./styles.css";

import bazaarData from "../../../public/data/bazaar.json";

const app = initializeApp({
    apiKey: "AIzaSyB7APiLe5PvHmzOrnmAFBRVuUtq7cnUXZY",
    authDomain: "economy-a063a.firebaseapp.com",
    projectId: "economy-a063a",
    storageBucket: "economy-a063a.firebasestorage.app",
    messagingSenderId: "852192366276",
    appId: "1:852192366276:web:e4d468cbc091628a894391",
});

const db = getFirestore(app);
const auth = getAuth(app);

async function loadBazaarPrices() {
    const response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
    if (!response.ok) {
        throw new Error("Failed to load bazaar data");
    }
    const data = await response.json();
    return data.products;
}

function generateBazaarTitle(page, categoryName, section, item, forced) {
    if (forced) {
        return forced;
    }

    if (page === "orders") {
        return `Bazaar ➜ Orders`;
    }

    if (!section && !item) {
        return `Bazaar ➜ ${categoryName}`;
    }
    if (section && (!item || item === section)) {
        return `${categoryName} ➜ ${section}`;
    }
    if (item) {
        return `${section} ➜ ${item}`;
    } else {
        return `Bazaar`;
    }
}

function getItemFromBazaarData(itemId) {
    for (const category of Object.values(bazaarData.categories)) {
        for (const section of Object.values(category.sections)) {
            const found = section.products.find(
                (product) => product.id === itemId
            );
            if (found) return found;
        }
    }
    return {
        name: "Unknown Item",
        icon: "/assets/icons/unknown.png",
        rarity: "ADMIN",
        enchanted: false,
        description: "This item does not exist in the bazaar data.",
        descriptionColour: "c",
    };
}

String.prototype.toTitleCase = function () {
    return this.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

Number.prototype.toFormattedString = function (decimals = 0) {
    return this.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function GamePage() {
    const [user, loading] = useAuthState(auth);
    const navigate = useNavigate();

    const [loadingBazaar, setLoadingBazaar] = useState(true);
    const [errorBazaar, setErrorBazaar] = useState(null);

    const [page, setPage] = useState("bazaar");
    const [category, setCategory] = useState("farming");
    const [section, setSection] = useState(null);
    const [item, setItem] = useState(null);

    const [loadingAccount, setLoadingAccount] = useState(true);
    const [account, setAccount] = useState({});
    const [products, setProducts] = useState({});
    const [itemDetail, setItemDetail] = useState(null);
    const [itemBazaarData, setItemBazaarData] = useState(null);

    useEffect(() => {
        loadBazaarPrices()
            .then((data) => {
                setProducts(data);
                setLoadingBazaar(false);
            })
            .catch((err) => {
                console.error(err);
                setErrorBazaar(err.message);
                setLoadingBazaar(false);
            });
    }, []);

    useEffect(() => {
        if (!loading && user) {
            getDoc(doc(db, "users", user.uid)).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    setAccount(docSnapshot.data());
                } else {
                    navigate("/signin");
                }
                setLoadingAccount(false);
            });
        }
    }, [loading, user, navigate]);

    if (loading || loadingBazaar || loadingAccount) return <Loading />;
    if (errorBazaar) return <div>Error: {errorBazaar}</div>;

    const currentCategory = bazaarData.categories[category];
    const currentSection = section ? currentCategory.sections[section] : null;

    if (!loading && !loadingBazaar && !loadingAccount) {
        return (
            <>
                <PanoramaBackground />
                <div className="game-page">
                    <div className="sidebar-stock">
                        <h1 className="sidebar-stock-header">INVENTORY</h1>
                        <ul>
                            {account.inventory.map((item) => (
                                <li key={item.id}>
                                    <img
                                        src={
                                            getItemFromBazaarData(item.id).icon
                                        }
                                        alt={
                                            getItemFromBazaarData(item.id).name
                                        }
                                    />
                                    <span>
                                        {item.quantity}x{" "}
                                        {getItemFromBazaarData(item.id).name}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="sidebar-info">
                        <h1>BAZAAR</h1>
                        <ul>
                            <li>
                                <span style={{ color: "var(--mc-gray)" }}>
                                    {moment().format("DD/MM/YYYY")}
                                </span>{" "}
                                <span style={{ color: "var(--mc-dark-gray)" }}>
                                    {moment().format("hh:mma")}
                                </span>
                            </li>
                            <br />
                            <li>
                                <span>Purse: </span>
                                <span style={{ color: "var(--mc-gold)" }}>
                                    {account.coins.toFormattedString(0)}
                                </span>
                            </li>
                            <li>
                                <span>Orders: </span>
                                <span style={{ color: "var(--mc-aqua)" }}>
                                    {account.orders.length.toFormattedString(0)}
                                    /14
                                </span>
                            </li>
                            <br />
                            <li>
                                <p style={{ color: "var(--mc-yellow)" }}>
                                    bazaar.jackweller.me
                                </p>
                            </li>
                        </ul>
                    </div>
                    <div className="bazaar">
                        <p className="bazaar-header">
                            {generateBazaarTitle(
                                page,
                                currentCategory.name,
                                currentSection?.name ?? null,
                                itemDetail?.name ?? null
                            )}
                        </p>
                        <div
                            className={`bazaar-container ${
                                page == "bazaar" && !section
                                    ? "six-rows"
                                    : "four-rows"
                            }`}
                        >
                            {/* CATEGORIES */}
                            {page == "bazaar" && !section && !item && (
                                <div className="bazaar-categories">
                                    {Object.values(bazaarData.categories).map(
                                        (cat) => (
                                            <Item
                                                key={cat.id}
                                                imageUrl={`/assets/icons/${cat.id}.png`}
                                                enchanted={false}
                                                tooltipTitle={`§${cat.colour}${cat.name}`}
                                                tooltipText={`§8Category`}
                                                onClick={() => {
                                                    setCategory(cat.id);
                                                    setSection(null);
                                                    setItem(null);
                                                    setItemDetail(null);
                                                }}
                                            />
                                        )
                                    )}
                                </div>
                            )}

                            {/* SECTIONS */}
                            {page == "bazaar" && !section && (
                                <div className="bazaar-sections">
                                    {Object.values(
                                        currentCategory.sections
                                    ).map((sec) => (
                                        <Item
                                            key={sec.id}
                                            imageUrl={`/assets/items/${sec.id.toTitleCase()}.png`}
                                            enchanted={false}
                                            tooltipTitle={`§e${sec.name}`}
                                            tooltipText={`§8${sec.products.length} products`}
                                            onClick={() => {
                                                setSection(sec.id);
                                                setItem(null);
                                                setItemDetail(null);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ITEMS */}
                            {page == "bazaar" && section && !item && (
                                <div className="bazaar-sections">
                                    {currentSection.products.map((itm) => (
                                        <Item
                                            key={itm.id}
                                            imageUrl={itm.icon}
                                            enchanted={itm.enchanted}
                                            tooltipTitle={`§${rarityToCode(
                                                itm.rarity
                                            )}${itm.name}`}
                                            tooltipText={`§8${itm.rarity.toTitleCase()} commodity`}
                                            onClick={() => {
                                                setItem(itm.id);
                                                setItemDetail(itm);
                                                setItemBazaarData(
                                                    products[itm.bazaarId]
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ITEM DETAIL VIEW */}
                            {page == "bazaar" &&
                                section &&
                                item &&
                                itemDetail && (
                                    <div className="bazaar-item-detail">
                                        <Item
                                            imageUrl="/assets/icons/instabuy.png"
                                            enchanted={false}
                                            tooltipTitle={`§aBuy Instantly`}
                                            tooltipText={`§8${
                                                itemDetail.name
                                            }§p§p§7Price per unit: §6${itemBazaarData?.quick_status?.buyPrice.toFormattedString(
                                                1
                                            )} coins§p§7Stack price: §6${(
                                                itemBazaarData?.quick_status
                                                    ?.buyPrice * 64
                                            ).toFormattedString(
                                                1
                                            )} coins§p§p§eClick to pick amount!`}
                                        />
                                        <Item
                                            imageUrl="/assets/icons/instasell.png"
                                            enchanted={false}
                                            tooltipTitle={`§6Sell Instantly`}
                                            tooltipText={`§8${
                                                itemDetail.name
                                            }§p§p§7Price per unit: §6${itemBazaarData?.quick_status?.sellPrice.toFormattedString(
                                                1
                                            )} coins`}
                                        />
                                        <div></div>
                                        <Item
                                            imageUrl={itemDetail.icon}
                                            enchanted={itemDetail.enchanted}
                                            tooltipTitle={`§${rarityToCode(
                                                itemDetail.rarity
                                            )}${itemDetail.name}`}
                                            tooltipText={`§${
                                                itemDetail.descriptionColour
                                            }${
                                                itemDetail.description
                                            }§p§p§l§${rarityToCode(
                                                itemDetail.rarity
                                            )}${itemDetail.rarity}`}
                                        />
                                        <div></div>
                                        <Item
                                            imageUrl="/assets/icons/buyorder.png"
                                            enchanted={false}
                                            tooltipTitle={`§aCreate Buy Order`}
                                            tooltipText={`§8${
                                                itemDetail.name
                                            }§p§p§aTop Orders:§p${itemBazaarData?.sell_summary
                                                .slice(0, 7)
                                                .map(
                                                    (order) =>
                                                        `§8- §6${order.pricePerUnit.toFormattedString(
                                                            1
                                                        )} coins §7each | §a${order.amount.toFormattedString(
                                                            0
                                                        )}§7x from §f${
                                                            order.orders
                                                        } ${
                                                            order.orders === 1
                                                                ? "order"
                                                                : "orders"
                                                        }`
                                                )
                                                .join("§p")}`}
                                        />

                                        <Item
                                            imageUrl="/assets/icons/selloffer.png"
                                            enchanted={false}
                                            tooltipTitle={`§6Create Sell Offer`}
                                            tooltipText={`§8${
                                                itemDetail.name
                                            }§p§p§6Top Offers:§p${itemBazaarData?.buy_summary
                                                .slice(0, 7)
                                                .map(
                                                    (order) =>
                                                        `§8- §6${order.pricePerUnit.toFormattedString(
                                                            1
                                                        )} coins §7each | §a${order.amount.toFormattedString(
                                                            0
                                                        )}§7x from §f${
                                                            order.orders
                                                        } ${
                                                            order.orders === 1
                                                                ? "offer"
                                                                : "offers"
                                                        }`
                                                )
                                                .join("§p")}`}
                                        />
                                    </div>
                                )}

                            {/* ORDERS PAGE */}
                            {page === "orders" && (
                                <div className="bazaar-orders"></div>
                            )}

                            {/* CONTROLS */}
                            {page === "bazaar" && (
                                <div className="bazaar-controls">
                                    {!section && !item ? (
                                        <Item
                                            imageUrl="/assets/icons/sellall.png"
                                            enchanted={false}
                                            tooltipTitle={`§aSell Inventory Now`}
                                            tooltipText={`§7Instantly sell all items in your inventory that can be sold on the Bazaar.`}
                                        />
                                    ) : (
                                        <div></div>
                                    )}

                                    {section || item ? (
                                        <Item
                                            imageUrl="/assets/icons/back.png"
                                            enchanted={false}
                                            tooltipTitle={`§aGo Back`}
                                            tooltipText={`§7To ${
                                                item
                                                    ? currentSection.name
                                                    : "Bazaar"
                                            }`}
                                            onClick={() => {
                                                if (item) {
                                                    setItem(null);
                                                    setItemDetail(null);
                                                } else if (section) {
                                                    setSection(null);
                                                } else {
                                                    setCategory("farming");
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div></div>
                                    )}

                                    {item ? (
                                        <Item
                                            imageUrl="/assets/icons/bazaar.png"
                                            enchanted={false}
                                            tooltipTitle={`§6Go Back`}
                                            tooltipText={`§7To Bazaar`}
                                            onClick={() => {
                                                setSection(null);
                                                setItem(null);
                                                setItemDetail(null);
                                            }}
                                        />
                                    ) : (
                                        <Item
                                            imageUrl="/assets/icons/home.png"
                                            enchanted={false}
                                            tooltipTitle={`§cHome`}
                                            onClick={() => {
                                                navigate("/");
                                            }}
                                        />
                                    )}

                                    <Item
                                        imageUrl="/assets/icons/orders.png"
                                        enchanted={false}
                                        tooltipTitle={`§aManage Orders`}
                                        tooltipText={`§eClick to manage!`}
                                        onClick={() => {
                                            setPage("orders");
                                            setSection(null);
                                            setItem(null);
                                            setItemDetail(null);
                                        }}
                                    />

                                    {!section && !item ? (
                                        <Item
                                            imageUrl="/assets/icons/history.png"
                                            enchanted={false}
                                            tooltipTitle={`§aView History`}
                                            tooltipText={`§eClick to view!`}
                                        />
                                    ) : (
                                        <div></div>
                                    )}

                                    {!section && !item ? (
                                        <Item
                                            imageUrl="/assets/icons/settings.png"
                                            enchanted={false}
                                            tooltipTitle={`§aSettings`}
                                            tooltipText={`§eClick to open!`}
                                        />
                                    ) : (
                                        <div></div>
                                    )}
                                </div>
                            )}
                            {page === "orders" && (
                                <div className="bazaar-controls">
                                    <div></div>
                                    <div></div>
                                    <Item
                                        imageUrl="/assets/icons/back.png"
                                        enchanted={false}
                                        tooltipTitle={`§aGo Back`}
                                        tooltipText={`§7To Bazaar`}
                                        onClick={() => {
                                            setPage("bazaar");
                                            setSection(null);
                                            setItem(null);
                                            setItemDetail(null);
                                        }}
                                    />
                                    <Item
                                        imageUrl="/assets/icons/claim.png"
                                        enchanted={false}
                                        tooltipTitle={`§aClaim All Coins`}
                                        tooltipText={`§7You don't have any coins to claim!`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }
}

function Item({ imageUrl, enchanted, tooltipTitle, tooltipText, onClick }) {
    return (
        <div className="bazaar-item bazaar-container-item" onClick={onClick}>
            <img
                src={imageUrl}
                alt={tooltipTitle}
                className={enchanted ? "bazaar-item-enchanted" : ""}
            />
            <div className="bazaar-container-item-tooltip">
                <p
                    dangerouslySetInnerHTML={{
                        __html: minecraftToHTML(tooltipTitle),
                    }}
                />
                {tooltipText && (
                    <p
                        dangerouslySetInnerHTML={{
                            __html: minecraftToHTML(tooltipText),
                        }}
                    />
                )}
            </div>
        </div>
    );
}
