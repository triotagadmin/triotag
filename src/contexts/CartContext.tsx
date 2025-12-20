import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  ticketId: string;
  title: string;
  price: number;
  quantity: number;
  eventDate: string;
  location: string;
  image_url?: string;
  maxQuantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (ticketId: string) => void;
  updateQuantity: (ticketId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("ticketCart");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("ticketCart", JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.ticketId === item.ticketId);
      if (existing) {
        const newQty = Math.min(existing.quantity + (item.quantity || 1), item.maxQuantity);
        return prev.map((i) =>
          i.ticketId === item.ticketId ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (ticketId: string) => {
    setItems((prev) => prev.filter((i) => i.ticketId !== ticketId));
  };

  const updateQuantity = (ticketId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(ticketId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.ticketId === ticketId
          ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
