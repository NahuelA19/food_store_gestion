/**
 * CartBadge — Shopping cart icon with item count badge
 */

import { ShoppingCart } from "lucide-react";
import { useCartContext } from "../../context/CartContext";
import { Icon } from "../ui/Icon";

export function CartBadge() {
  const { itemCount } = useCartContext();

  return (
    <span className="relative inline-flex items-center justify-center">
      <Icon icon={ShoppingCart} size={22} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white leading-none shadow-sm">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </span>
  );
}
