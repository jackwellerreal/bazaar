import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import moment from "moment";

import { initializeApp } from "firebase/app";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
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
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
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

Number.prototype.toFormattedString = function ({
    decimals = 0,
    roundTo = null,
    short = false,
    trailingZeroes = false,
} = {}) {
    let value = this;

    if (roundTo !== null && typeof roundTo === "number" && roundTo > 0) {
        const factor = Math.pow(10, roundTo);
        value = Math.round(value * factor) / factor;
    }

    const formatNumber = (num) => {
        let str = num.toFixed(decimals);
        if (!trailingZeroes) {
            str = str.replace(/\.?0+$/, "");
        }
        return str;
    };

    if (short) {
        if (value >= 1e9) {
            return formatNumber(value / 1e9) + "B";
        } else if (value >= 1e6) {
            return formatNumber(value / 1e6) + "M";
        } else if (value >= 1e3) {
            return formatNumber(value / 1e3) + "K";
        } else {
            return formatNumber(value);
        }
    } else {
        return formatNumber(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
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
        } else if (!loading && !user) {
            setLoadingAccount(false);
            navigate("/signin");
        }
    }, [loading, user, navigate]);

    const instantBuy = async (itemId, amount) => {
        try {
            console.log("[instantBuy] itemId:", itemId, "amount:", amount);

            const itemData = getItemFromBazaarData(itemId);
            if (!itemData || !itemData.bazaarId) {
                console.error("Item not found in bazaar data structure.");
                return;
            }

            const pricePerUnit =
                products[itemData.bazaarId]?.quick_status?.buyPrice;
            if (pricePerUnit == null) {
                console.error(
                    "Live bazaar price not found for item:",
                    itemData.name
                );
                return;
            }

            const totalCost = pricePerUnit * amount;
            if (account.coins < totalCost) {
                console.error(
                    `Not enough coins: have ${account.coins}, need ${totalCost}`
                );
                return;
            }

            const newInventory = [...account.inventory];
            const existingItem = newInventory.find((i) => i.id === itemId);

            if (existingItem) {
                existingItem.quantity += amount;
            } else {
                newInventory.push({ id: itemId, quantity: amount });
            }

            const newCoins = account.coins - totalCost;

            await updateDoc(doc(db, "users", user.uid), {
                inventory: newInventory,
                coins: newCoins,
                lastUpdated: Timestamp.now(),
            });

            setAccount((prev) => ({
                ...prev,
                inventory: newInventory,
                coins: newCoins,
            }));

            console.log(
                `✅ Bought ${amount}x ${itemData.name} for ${totalCost.toFormattedString({ decimals: 0 })} coins`
            );
        } catch (error) {
            console.error("Error in instantBuy:", error);
        }
    };

    const instantSell = async (itemId, amount) => {
        try {
            console.log("[instantSell] itemId:", itemId, "amount:", amount);

            const itemData = getItemFromBazaarData(itemId);
            if (!itemData || !itemData.bazaarId) {
                console.error("Item not found in bazaar data structure.");
                return;
            }

            const pricePerUnit =
                products[itemData.bazaarId]?.quick_status?.sellPrice;
            if (pricePerUnit == null) {
                console.error(
                    "Live bazaar price not found for item:",
                    itemData.name
                );
                return;
            }

            const existingItem = account.inventory.find((i) => i.id === itemId);
            if (!existingItem || existingItem.quantity < amount) {
                console.error(
                    `Not enough ${itemData.name} to sell: have ${existingItem?.quantity ?? 0}, need ${amount}`
                );
                return;
            }

            const totalEarnings = pricePerUnit * amount;
            const newInventory = account.inventory
                .map((item) => {
                    if (item.id === itemId) {
                        const newQuantity = item.quantity - amount;
                        return newQuantity > 0
                            ? { ...item, quantity: newQuantity }
                            : null;
                    }
                    return item;
                })
                .filter(Boolean);

            const newCoins = account.coins + totalEarnings;

            await updateDoc(doc(db, "users", user.uid), {
                inventory: newInventory,
                coins: newCoins,
                lastUpdated: Timestamp.now(),
            });

            setAccount((prev) => ({
                ...prev,
                inventory: newInventory,
                coins: newCoins,
            }));

            console.log(
                `✅ Sold ${amount}x ${itemData.name} for ${totalEarnings.toFormattedString({ decimals: 0 })} coins`
            );
        } catch (error) {
            console.error("Error in instantSell:", error);
        }
    };

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
                                    {account.coins.toFormattedString({
                                        decimals: 0,
                                    })}
                                </span>
                            </li>
                            <li>
                                <span>Orders: </span>
                                <span style={{ color: "var(--mc-aqua)" }}>
                                    {account.orders.length.toFormattedString({
                                        decimals: 0,
                                        trailingZeroes: true,
                                    })}
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
                                    {currentSection.products.map((itm) => {
                                        const bazaarData =
                                            products[itm.bazaarId];

                                        return (
                                            <Item
                                                key={itm.id}
                                                imageUrl={itm.icon}
                                                enchanted={itm.enchanted}
                                                tooltipTitle={`§${rarityToCode(itm.rarity)}${itm.name}`}
                                                tooltipText={`
                                                §8${itm.rarity.toTitleCase()} commodity
                                                §p§p
                                                §7Buy price: §6${
                                                    bazaarData.quick_status
                                                        .buyVolume === 0
                                                        ? `§8N/A`
                                                        : `§6${bazaarData.quick_status.buyPrice.toFormattedString?.({ decimals: 1 })} coins`
                                                } coins
                                                ${
                                                    bazaarData.quick_status
                                                        .buyVolume === 0
                                                        ? `§p§8No Orders!`
                                                        : `
                                                §p§8${bazaarData.quick_status.buyVolume.toFormattedString(
                                                    {
                                                        decimals: 1,
                                                        short: true,
                                                    }
                                                )} in ${bazaarData.quick_status.buyOrders} orders
                                                §p§8${bazaarData.quick_status.buyMovingWeek.toFormattedString(
                                                    {
                                                        decimals: 1,
                                                        short: true,
                                                    }
                                                )} insta-buys in 7d§p§p`
                                                }
                                                §7Sell price: ${
                                                    bazaarData.quick_status
                                                        .sellVolume === 0
                                                        ? `§8N/A`
                                                        : `§6${bazaarData.quick_status.sellPrice.toFormattedString?.({ decimals: 1 })} coins`
                                                }
                                                ${
                                                    bazaarData.quick_status
                                                        .sellVolume === 0
                                                        ? `§p§8No Orders!`
                                                        : `
                                                §p§8${bazaarData.quick_status.sellVolume.toFormattedString(
                                                    {
                                                        decimals: 1,
                                                        short: true,
                                                    }
                                                )} in ${bazaarData.quick_status.sellOrders} orders
                                                §p§8${bazaarData.quick_status.sellMovingWeek.toFormattedString(
                                                    {
                                                        decimals: 1,
                                                        short: true,
                                                    }
                                                )} insta-sells in 7d`
                                                }
                                                §p§p
                                                §eClick to view details!`}
                                                onClick={() => {
                                                    setItem(itm.id);
                                                    setItemDetail(itm);
                                                    setItemBazaarData(
                                                        bazaarData
                                                    );
                                                }}
                                            />
                                        );
                                    })}
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
                                            tooltipText={(() => {
                                                const hasSellOffers =
                                                    itemBazaarData?.buy_summary
                                                        ?.length > 0;
                                                const price =
                                                    itemBazaarData?.quick_status
                                                        ?.buyPrice ?? 0;

                                                if (!hasSellOffers) {
                                                    return `§7No one is selling this item!§p§p§cThere are no Sell Offers!`;
                                                }

                                                return `§8${itemDetail.name}§p§p§7Price per unit: §6${price.toFormattedString?.({ decimals: 1 })} coins§p§p§eClick to pick amount!`;
                                            })()}
                                            onClick={() => {
                                                const hasSellOffers =
                                                    itemBazaarData?.buy_summary
                                                        ?.length > 0;
                                                if (!hasSellOffers) return; // silently do nothing

                                                const rawAmount = prompt(
                                                    `How many ${itemDetail.name} would you like to buy? (1-1024)`
                                                );
                                                const amount =
                                                    parseInt(rawAmount);
                                                if (
                                                    !Number.isInteger(amount) ||
                                                    amount < 1 ||
                                                    amount > 1024
                                                )
                                                    return; // silently do nothing

                                                const pricePerUnit =
                                                    itemBazaarData?.quick_status
                                                        ?.buyPrice ?? 0;
                                                const totalCost =
                                                    pricePerUnit * amount;

                                                if (account.coins < totalCost)
                                                    return; // silently do nothing

                                                instantBuy(
                                                    itemDetail.id,
                                                    amount
                                                );
                                            }}
                                        />

                                        <Item
                                            imageUrl="/assets/icons/instasell.png"
                                            enchanted={false}
                                            tooltipTitle={`§6Sell Instantly`}
                                            tooltipText={(() => {
                                                const hasBuyOrders =
                                                    itemBazaarData?.sell_summary
                                                        ?.length > 0;
                                                const itemInInventory =
                                                    account.inventory.find(
                                                        (i) =>
                                                            i.id ===
                                                            itemDetail.id
                                                    );
                                                const quantityInInventory =
                                                    itemInInventory?.quantity ??
                                                    0;
                                                const unitPrice =
                                                    itemBazaarData?.quick_status
                                                        ?.sellPrice ?? 0;
                                                const totalSellValue =
                                                    unitPrice *
                                                    quantityInInventory;

                                                if (quantityInInventory > 0) {
                                                    if (!hasBuyOrders) {
                                                        return `§8${itemDetail.name}§p§p§7Inventory: §a${quantityInInventory} items§p§p§7No one wants to buy that!`;
                                                    }

                                                    return `§8${itemDetail.name}§p§p§7Inventory: §a${quantityInInventory} items§p§p§7Amount: §a${quantityInInventory}§7x§p§7Total: §6${totalSellValue.toFormattedString?.({ decimals: 1 })} coins§p§p§eClick to sell!`;
                                                } else {
                                                    if (!hasBuyOrders) {
                                                        return `§8${itemDetail.name}§p§p§7Inventory: §cNone!§p§p§cNo one is buying!`;
                                                    }

                                                    return `§8${itemDetail.name}§p§p§7Inventory: §cNone!§p§p§7Price per unit: §6${unitPrice.toFormattedString?.({ decimals: 1 })} coins§p§p§8None to sell in your inventory!`;
                                                }
                                            })()}
                                            onClick={() => {
                                                const hasBuyOrders =
                                                    itemBazaarData?.sell_summary
                                                        ?.length > 0;
                                                if (!hasBuyOrders) return; // silently do nothing

                                                const itemInInventory =
                                                    account.inventory.find(
                                                        (i) =>
                                                            i.id ===
                                                            itemDetail.id
                                                    );
                                                const quantityInInventory =
                                                    itemInInventory?.quantity ??
                                                    0;
                                                if (quantityInInventory === 0)
                                                    return; // silently do nothing

                                                instantSell(
                                                    itemDetail.id,
                                                    quantityInInventory
                                                );
                                            }}
                                        />

                                        <div />

                                        <Item
                                            imageUrl={itemDetail.icon}
                                            enchanted={itemDetail.enchanted}
                                            tooltipTitle={`§${rarityToCode(itemDetail.rarity)}${itemDetail.name}`}
                                            tooltipText={`§${itemDetail.descriptionColour}${itemDetail.description}§p§p§l§${rarityToCode(itemDetail.rarity)}${itemDetail.rarity}`}
                                        />

                                        <div />

                                        <Item
                                            imageUrl="/assets/icons/buyorder.png"
                                            enchanted={false}
                                            tooltipTitle={`§aCreate Buy Order`}
                                            tooltipText={(() => {
                                                const hasSellOffers =
                                                    itemBazaarData?.sell_summary
                                                        ?.length > 0;
                                                if (!hasSellOffers) {
                                                    return `§8${itemDetail.name}§p§p§7No one wants to buy that!§p§p§eBe the first to order it!`;
                                                }

                                                const topOrders =
                                                    itemBazaarData.sell_summary
                                                        .slice(0, 7)
                                                        .map(
                                                            (order) =>
                                                                `§8- §6${order.pricePerUnit.toFormattedString?.({ decimals: 1, trailingZeroes: true })} coins §7each | §a${order.amount.toFormattedString?.({ decimals: 1 })}§7x from §f${order.orders} ${order.orders === 1 ? "order" : "orders"}`
                                                        )
                                                        .join("§p");

                                                return `§8${itemDetail.name}§p§p§aTop Orders:§p${topOrders}`;
                                            })()}
                                        />

                                        <Item
                                            imageUrl="/assets/icons/selloffer.png"
                                            enchanted={false}
                                            tooltipTitle={`§6Create Sell Offer`}
                                            tooltipText={(() => {
                                                const hasBuyOrders =
                                                    itemBazaarData?.buy_summary
                                                        ?.length > 0;
                                                if (!hasBuyOrders) {
                                                    return `§8${itemDetail.name}§p§p§7No one is selling that!`;
                                                }

                                                const topOffers =
                                                    itemBazaarData.buy_summary
                                                        .slice(0, 7)
                                                        .map(
                                                            (order) =>
                                                                `§8- §6${order.pricePerUnit.toFormattedString?.({ decimals: 1, trailingZeroes: true })} coins §7each | §a${order.amount.toFormattedString?.({ decimals: 0 })}§7x from §f${order.orders} ${order.orders === 1 ? "offer" : "offers"}`
                                                        )
                                                        .join("§p");

                                                return `§8${itemDetail.name}§p§p§6Top Offers:§p${topOffers}`;
                                            })()}
                                        />
                                    </div>
                                )}

                            {/* ORDERS PAGE */}
                            {page === "orders" && (
                                <div className="bazaar-orders">
                                    <div className="bazaar-orders-type"></div>
                                    <div className="bazaar-orders-type"></div>
                                </div>
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
