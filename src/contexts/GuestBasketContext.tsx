import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface GuestBasketItem {
  listing_id: string;
  listing_title: string;
  branch_id: string | null;
  branch_name: string;
  branch_address: string;
  city: string;
  unit_type: string;
  unit_price: number;
  quantity: number;
  duration_weeks: number;
  currency: string;
}

interface GuestBasketContextType {
  items: GuestBasketItem[];
  addLocation: (item: GuestBasketItem) => void;
  removeLocation: (branch_id: string | null, listing_id: string) => void;
  updateItem: (branch_id: string | null, listing_id: string, updates: Partial<Pick<GuestBasketItem, "quantity" | "duration_weeks">>) => void;
  clearBasket: () => void;
  totalLocations: number;
  totalQuantity: number;
  grandTotal: number;
}

const GuestBasketContext = createContext<GuestBasketContextType | undefined>(undefined);

export const useGuestBasket = () => {
  const context = useContext(GuestBasketContext);
  if (!context) throw new Error("useGuestBasket must be used within GuestBasketProvider");
  return context;
};

const itemKey = (item: { branch_id: string | null; listing_id: string }) =>
  `${item.listing_id}::${item.branch_id ?? "head"}`;

export const GuestBasketProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<GuestBasketItem[]>(() => {
    try {
      const saved = localStorage.getItem("guestBasket");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("guestBasket", JSON.stringify(items));
  }, [items]);

  const addLocation = (item: GuestBasketItem) => {
    setItems(prev => {
      const key = itemKey(item);
      if (prev.some(i => itemKey(i) === key)) return prev;
      return [...prev, item];
    });
  };

  const removeLocation = (branch_id: string | null, listing_id: string) => {
    const key = `${listing_id}::${branch_id ?? "head"}`;
    setItems(prev => prev.filter(i => itemKey(i) !== key));
  };

  const updateItem = (branch_id: string | null, listing_id: string, updates: Partial<Pick<GuestBasketItem, "quantity" | "duration_weeks">>) => {
    const key = `${listing_id}::${branch_id ?? "head"}`;
    setItems(prev => prev.map(i => itemKey(i) === key ? { ...i, ...updates } : i));
  };

  const clearBasket = () => setItems([]);

  const totalLocations = items.length;
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const grandTotal = items.reduce((s, i) => s + i.unit_price * i.quantity * i.duration_weeks, 0);

  return (
    <GuestBasketContext.Provider value={{ items, addLocation, removeLocation, updateItem, clearBasket, totalLocations, totalQuantity, grandTotal }}>
      {children}
    </GuestBasketContext.Provider>
  );
};
